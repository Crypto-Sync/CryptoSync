// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";


import {AggregatorInterface} from "./Interfaces/AggregatorInterface.sol";

contract PoolContract {
    address[2] public tokens;
    address public owner;
    address immutable stableCoin = 0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C; //USDT 
    uint256[2] public proportions;
    uint256[2] public initialTokenValues;
    uint256[2] public takeProfit;
    uint256[2] public stopLoss;
    uint256 public threshold;
    uint256 public timePeriod;

    AggregatorInterface oracleForToken0;
    AggregatorInterface oracleForToken1;

    uint256 constant MAX_BPS = 10_000; // for Percentage Values

    ISwapRouter public swapRouter;
    uint256 public lastChecked;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the pool owner.");
        _;
    }

    event Rebalanced(address[2] tokens, uint256[2] proportions);
    event TakeProfitExecuted(address token, uint256 amountConverted);
    event StopLossExecuted(address token, uint256 amountConverted);
    event ParametersUpdated(
        uint256 newThreshold,
        uint256[2] newTakeProfit,
        uint256[2] newStopLoss
    );
    event TokensWithdrawn(address token, uint256 amount);
    event TokensDeposited(address token, uint256 amount);

    constructor(
        address[2] memory _tokens,
        uint256[2] memory _initialTokenValues,
        uint256[2] memory _proportions,
        uint256 _threshold,
        uint256[2] memory _takeProfit,
        uint256[2] memory _stopLoss,
        uint256 _timePeriod,
        address _owner,
        address _oracleForToken0,
        address _oracleForToken1
    ) {
        tokens = _tokens;
        proportions = _proportions;
        threshold = _threshold;
        takeProfit = _takeProfit;
        stopLoss = _stopLoss;
        timePeriod = _timePeriod;
        owner = _owner;
        lastChecked = block.timestamp;
        initialTokenValues = _initialTokenValues;
        oracleForToken0 = AggregatorInterface(_oracleForToken0);
        oracleForToken1 = AggregatorInterface(_oracleForToken1);
        swapRouter = ISwapRouter(0x61Ec26aA57019C486B10502285c5A3D4A4750AD7); //need to change this
    }

    function fetchPrices() public view returns (uint256[2] memory) {
        int256[2] memory rawPrices;
        uint256[2] memory prices;

        rawPrices[0] = oracleForToken0.latestAnswer();
        rawPrices[1] = oracleForToken1.latestAnswer();

        for (uint i = 0; i < 2; i++) {
            if (rawPrices[i] < 0) {
                prices[i] = uint256(-rawPrices[i]);
            } else {
                prices[i] = uint256(rawPrices[i]);
            }
        }

        return prices;
    }

    function _swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal {
        IERC20(tokenIn).approve(address(swapRouter), amountIn);
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp + 60,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        swapRouter.exactInputSingle(params);
    }

    // ********************************************For take Profit ******************************************** //

    function _checkProfit(
        uint256[2] memory prices
    ) internal view returns (bool[2] memory) {
        bool[2] memory profitReached;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 currentTokenValue = (IERC20(tokens[i]).balanceOf(
                address(this)
            ) * prices[i]) / 10**getDecimalOfToken(tokens[i]); //(in this price should be in noraml from like 1000$)
            uint256 difference = currentTokenValue > initialTokenValues[i]
                ? currentTokenValue - initialTokenValues[i]
                : 0;
            uint256 profitPercentage = (difference * MAX_BPS) /
                initialTokenValues[i];
            profitReached[i] = profitPercentage >= takeProfit[i];
        }
        return profitReached;
    }

    function _executeTakeProfit(
        uint256[2] memory prices,
        bool[2] memory profitReached
    ) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (profitReached[i]) {
                uint256 currentTokenValue = (IERC20(tokens[i]).balanceOf(
                    address(this)
                ) * prices[i]) / 10**getDecimalOfToken(tokens[i]); //(in this price should be in noraml from like 1000$)
                uint256 profit = currentTokenValue - initialTokenValues[i];
                uint256 amountToSwap = (profit *
                    10 ** getDecimalOfToken(tokens[i])) / prices[i];
                
                _swapTokens(tokens[i], stableCoin, amountToSwap);
                emit TakeProfitExecuted(tokens[i], amountToSwap);
            }
        }
    }

    // ********************************************For handle Loss ********************************************  //

    function _checkAndExecuteStopLoss(uint256[2] memory prices) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (prices[i] <= stopLoss[i]) {
                uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
                _swapTokens(tokens[i], stableCoin, balance);
                emit StopLossExecuted(tokens[i], balance);
            }
        }
    }

    function _getPoolValue(
        uint256[2] memory prices
    ) internal view returns (uint256 value) {
        for (uint256 i = 0; i < tokens.length; i++) {
            value +=
                (IERC20(tokens[i]).balanceOf(address(this)) * prices[i]) /
                10**getDecimalOfToken(tokens[i]);
        }
    }

    // ********************************************for rebalance ********************************************  //

    function _checkRebalanceNeeded(
        uint256[2] memory prices
    ) internal view returns (bool) {
        uint256 poolValue = _getPoolValue(prices);
        uint256 valueOfToken0 = (IERC20(tokens[0]).balanceOf(address(this)) *
            prices[0]) / 10**getDecimalOfToken(tokens[0]);

        uint256 currentPercentage = (valueOfToken0 * MAX_BPS) / poolValue;
        uint256 diffPercentage = currentPercentage > proportions[0]
            ? currentPercentage - proportions[0]
            : proportions[0] - currentPercentage;
        return diffPercentage > threshold;
    }

    function _executeRebalance(
        uint256[2] memory prices
    ) internal {
        uint256 poolValue = _getPoolValue(prices);
        uint256 valueOfToken0 = (IERC20(tokens[0]).balanceOf(address(this)) *
            prices[0]) / 10**getDecimalOfToken(tokens[0]);
        uint256 currentPercentage = (valueOfToken0 * MAX_BPS) / poolValue;
        uint256 diffPercentage = currentPercentage > proportions[0]
            ? currentPercentage - proportions[0]
            : proportions[0] - currentPercentage;

        uint256 valueToSwap = (poolValue * diffPercentage) / MAX_BPS;
        uint256 amountToSwap;
        address fromToken;
        address toToken;

        if (currentPercentage > proportions[0]) {
            fromToken = tokens[0];
            toToken = tokens[1];
            amountToSwap =
                (valueToSwap * 10 ** getDecimalOfToken(fromToken)) /
                prices[0];
        } else if (currentPercentage < proportions[0]) {
            fromToken = tokens[1];
            toToken = tokens[0];
            amountToSwap =
                (valueToSwap * 10 ** getDecimalOfToken(fromToken)) /
                prices[1];
        }

        _swapTokens(fromToken, toToken, amountToSwap);
        emit Rebalanced(tokens, proportions);
    }

    function rebalance() public onlyOwner {
        require(
            block.timestamp >= lastChecked + timePeriod,
            "Rebalance: Time period not reached."
        );
        lastChecked = block.timestamp;

        uint256[2] memory prices = fetchPrices();

        // Check stop-loss conditions
        _checkAndExecuteStopLoss(prices);

        // Check take profit conditions
        bool[2] memory profitReached = _checkProfit(prices);
        _executeTakeProfit(prices, profitReached);

        // Check if rebalance is needed
        bool rebalanceNeeded = _checkRebalanceNeeded(prices);

        if (rebalanceNeeded) {
            if (
                (profitReached[0] && !profitReached[1]) ||
                (!profitReached[0] && profitReached[1])
            ) {
                profitReached[0] = !profitReached[0];
                profitReached[1] = !profitReached[1];

                _executeTakeProfit(prices, profitReached);
            } else {
                _executeRebalance(prices);
            }
        }
    }

    // ********************************************For Update parameters ******************************************** //

   /**
     * @dev Allows the pool owner to update various parameters in one function call.
     * Only updates parameters if the new values are greater than 0 and different from the current values.
     * If any parameter is passed as 0, it will retain the current/default value.
     * @param newThreshold The new threshold value for rebalancing.
     * @param newProportions The new proportions for the two assets.
     * @param newTakeProfit The new take profit percentages for the two assets.
     * @param newStopLoss The new stop loss prices for the two assets.
     */
    function updateParameters(
        uint256 newThreshold,
        uint256[2] memory newProportions,
        uint256[2] memory newTakeProfit,
        uint256[2] memory newStopLoss
    ) public onlyOwner {
        // Check and update threshold
        if (newThreshold > 0 && newThreshold != threshold) {
            require(newThreshold <= MAX_BPS, "Threshold must be <= 10_000");
            threshold = newThreshold;
        }
        // Check and update proportions
        for (uint8 i = 0; i < 2; i++) {
            if (newProportions[i] > 0 && newProportions[i] != proportions[i]) {
                proportions[i] = newProportions[i];
            }
        }

        // Check and update takeProfit
        for (uint8 i = 0; i < 2; i++) {
            if (newTakeProfit[i] == 0) {
                continue;
            }
            require(
                newTakeProfit[i] > threshold,
                "new take Profit should be greater than threshold"
            );
            if (newTakeProfit[i] > 0 && newTakeProfit[i] != takeProfit[i]) {
                takeProfit[i] = newTakeProfit[i];
            }
        }
        // Check and update stopLoss
        for (uint8 i = 0; i < 2; i++) {
            if (newStopLoss[i] > 0 && newStopLoss[i] != stopLoss[i]) {
                stopLoss[i] = newStopLoss[i];
            }
        }
    }

    /**
     * @dev Allows the pool owner to deposit specified amounts of tokens in the pool.
     * @param _tokens Array of token addresses to deposit.
     * @param _amounts Array of amounts of tokens to deposit.
     */
    function depositTokens(
        address[] calldata _tokens,
        uint256[] calldata _amounts
    ) external onlyOwner {
        require(tokens.length == _amounts.length, "Arrays length mismatch.");

        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_amounts[i] > 0) {
                IERC20(tokens[i]).transferFrom(
                    msg.sender,
                    address(this),
                    _amounts[i]
                );
                emit TokensDeposited(tokens[i], _amounts[i]);
            }
        }
    }

    /**
     * @dev Allows the pool owner to withdraw specified amounts of tokens from the pool.
     * @param _tokens Array of token addresses to withdraw.
     * @param _amounts Array of amounts of tokens to withdraw.
     */
    function withdrawTokens(
        address[] calldata _tokens,
        uint256[] calldata _amounts
    ) external onlyOwner {
        require(tokens.length == _amounts.length, "Arrays length mismatch.");

        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_amounts[i] > 0) {
                uint256 contractBalance = IERC20(tokens[i]).balanceOf(
                    address(this)
                );
                require(
                    contractBalance >= _amounts[i],
                    "Insufficient balance to withdraw."
                );

                IERC20(tokens[i]).transfer(owner, _amounts[i]);
                emit TokensWithdrawn(tokens[i], _amounts[i]);
            }
        }
    }

    // ******************************************** all getter funcntions ********************************************  //

    function getDecimalOfToken(address token) public view returns (uint8) {
        return IERC20Metadata(token).decimals();
    }

    //it will only use when two tokens have different decimals
    function getDecimalOfPriceOracle(
        address oracle
    ) public view returns (uint8) {
        return AggregatorInterface(oracle).decimals();
    }
}
