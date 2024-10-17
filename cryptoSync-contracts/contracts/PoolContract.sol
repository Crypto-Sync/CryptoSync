// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PoolFactory.sol";
import "./Interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract PoolContract {
    PoolFactory public factory;

    address[2] public tokens;
    address public owner;
    address immutable stableCoin = 0xECa9bC828A3005B9a3b909f2cc5c2a54794DE05F;
    uint256[2] public proportions;
    uint256[2] public initialTokenValues;
    uint256[2] public takeProfit;
    uint256[2] public stopLoss;
    uint256 public threshold;
    uint256 public timePeriod;

    uint256 constant MAX_BPS = 10_000; // for Percentage Values

    IUniswapV2Router02 public swapRouter;
    uint256 public lastChecked;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the pool owner.");
        _;
    }

    modifier onlyOperator() {
        require(factory.isOperator(msg.sender), "You are not the operator");
        _;
    }

    event RebalanceExecuted(
        address fromToken,
        address toToken,
        uint256 amountToSwap
    );
    event TakeProfitExecuted(address token, uint256 amountConverted);
    event StopLossExecuted(
        address token,
        uint256 amountConverted,
        uint256 price
    );
    event ParametersUpdated(
        uint256 newThreshold,
        uint256[2] newTakeProfit,
        uint256[2] newStopLoss
    );
    event TokensWithdrawn(address token, uint256 amount);
    event TokensDeposited(address token, uint256 amount);

    constructor(
        address _factoryAddress,
        address[2] memory _tokens,
        uint256[2] memory _initialTokenValues,
        uint256[2] memory _proportions,
        uint256 _threshold,
        uint256[2] memory _takeProfit,
        uint256[2] memory _stopLoss,
        uint256 _timePeriod,
        address _owner
    ) {
        factory = PoolFactory(_factoryAddress);
        tokens = _tokens;
        proportions = _proportions;
        threshold = _threshold;
        takeProfit = _takeProfit;
        stopLoss = _stopLoss;
        timePeriod = _timePeriod;
        owner = _owner;
        lastChecked = block.timestamp;
        initialTokenValues = _initialTokenValues;
        swapRouter = IUniswapV2Router02(
            0x706254C29Acdc03ec51e4751B53eC3FbD8Ba7c25
        );
    }

    function fetchPrices() public view returns (uint256[2] memory) {
        uint256[2] memory prices;
        prices[0] = factory.getOnChainPrice(tokens[0]);
        prices[1] = factory.getOnChainPrice(tokens[1]);

        return prices;
    }

    function _swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal {       
        require(amountIn > 0, "Amount must be > 0");

        // Determine the path
        address[] memory path;
        if (tokenOut == stableCoin) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = stableCoin;
            path[2] = tokenOut;
        }

        // Approve router to spend tokens
        IERC20(tokenIn).approve(address(swapRouter), amountIn);

        // Perform the swap
        swapRouter.swapExactTokensForTokens(
            amountIn,
            0, // Use the minimum output parameter
            path,
            address(this),
            block.timestamp + 15 //deadline
        );
    }

    // ********************************************For take Profit ******************************************** //

    function _checkProfit(
        uint256[2] memory prices
    ) internal view returns (bool[2] memory) {
        bool[2] memory profitReached;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 currentTokenValue = (balanceOf(tokens[i]) * prices[i]) /
                10 ** getDecimalOfToken(tokens[i]); //(in this price should be in noraml from like 1000$)
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
                uint256 currentTokenValue = (balanceOf(tokens[i]) * prices[i]) /
                    10 ** getDecimalOfToken(tokens[i]); //(in this price should be in noraml from like 1000$)
                uint256 profit = currentTokenValue - initialTokenValues[i];
                uint256 amountToSwap = (profit *
                    10 ** getDecimalOfToken(tokens[i])) / prices[i];
                if (amountToSwap > 0) {
                    _swapTokens(tokens[i], stableCoin, amountToSwap);
                    emit TakeProfitExecuted(tokens[i], amountToSwap);
                }
            }
        }
    }

    // ********************************************For handle Loss ********************************************  //

    function _checkAndExecuteStopLoss(uint256[2] memory prices) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (prices[i] <= stopLoss[i]) {
                uint256 balance = balanceOf(tokens[i]);
                if (balance > 0) {
                    _swapTokens(tokens[i], stableCoin, balance);
                    emit StopLossExecuted(
                        tokens[i],
                        balance,
                        factory.getOnChainPrice(tokens[i])
                    );
                }
            }
        }
    }

    function _getPoolValue(
        uint256[2] memory prices
    ) internal view returns (uint256 value) {
        for (uint256 i = 0; i < tokens.length; i++) {
            value +=
                (balanceOf(tokens[i]) * prices[i]) /
                10 ** getDecimalOfToken(tokens[i]);
        }
    }

    // ********************************************for rebalance ********************************************  //

    function _checkRebalanceNeeded(
        uint256[2] memory prices
    ) internal view returns (bool) {
        uint256 poolValue = _getPoolValue(prices);
        uint256 valueOfToken0 = (balanceOf(tokens[0]) * prices[0]) /
            10 ** getDecimalOfToken(tokens[0]);

        uint256 currentPercentage = (valueOfToken0 * MAX_BPS) / poolValue;
        uint256 diffPercentage = currentPercentage > proportions[0]
            ? currentPercentage - proportions[0]
            : proportions[0] - currentPercentage;
        if (balanceOf(tokens[0]) == 0 || balanceOf(tokens[1]) == 0) {
            return false;
        }
        return diffPercentage > threshold;
    }

    function _executeRebalance(uint256[2] memory prices) internal {
        uint256 poolValue = _getPoolValue(prices);
        uint256 valueOfToken0 = (balanceOf(tokens[0]) * prices[0]) /
            10 ** getDecimalOfToken(tokens[0]);
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
        if (amountToSwap > 0) {
            _swapTokens(fromToken, toToken, amountToSwap);
            emit RebalanceExecuted(fromToken, toToken, amountToSwap);
        }
    }

    function rebalance() external onlyOperator {
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
     * @param _amounts Array of amounts of tokens to deposit.
     */
    function depositTokens(
        uint256[] calldata _amounts
    ) external onlyOwner {
        require(tokens.length == _amounts.length, "Arrays length mismatch.");
        
        uint256[2] memory prices = fetchPrices();

        for (uint256 i = 0; i < tokens.length; i++) {
            if (_amounts[i] > 0) {
                IERC20(tokens[i]).transferFrom(
                    msg.sender,
                    address(this),
                    _amounts[i]
                );
                initialTokenValues[i] = prices[i] * balanceOf(tokens[i]);
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
        require(_tokens.length == _amounts.length, "Arrays length mismatch.");

        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_amounts[i] > 0) {
                uint256 contractBalance = balanceOf(_tokens[i]);
                require(
                    contractBalance >= _amounts[i],
                    "Insufficient balance to withdraw."
                );

                IERC20(_tokens[i]).transfer(owner, _amounts[i]);
                emit TokensWithdrawn(_tokens[i], _amounts[i]);
            }
        }
    }

    // ******************************************** all getter funcntions ********************************************  //

    function balanceOf(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getDecimalOfToken(address token) public view returns (uint8) {
        return IERC20Metadata(token).decimals();
    }

    function getTokenBalanceInUSD()
        public
        view
        returns (uint256 totalValueInUSD, uint256[2] memory valueProportions)
    {
        uint256[2] memory prices = fetchPrices();
        uint256[2] memory tokenValuesInUSD;
        totalValueInUSD = 0;

        // Calculate the total value in USD for each token and the total pool value
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenBalance = balanceOf(tokens[i]);
            tokenValuesInUSD[i] =
                (tokenBalance * prices[i]) /
                10 ** getDecimalOfToken(tokens[i]);
            totalValueInUSD += tokenValuesInUSD[i];
        }

        // Calculate the proportion of each token's value as part of the total value
        if (totalValueInUSD > 0) {
            for (uint256 i = 0; i < tokens.length; i++) {
                valueProportions[i] =
                    (tokenValuesInUSD[i] * 10_000) /
                    totalValueInUSD; // Value proportion in basis points (BPS)
            }
        }
    }
}
