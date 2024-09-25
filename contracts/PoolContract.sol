// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./PoolFactory.sol";

contract PoolContract {
    address[2] public tokens;
    address public owner;
    address public stablecoin;
    uint256[2] public proportions;
    uint256[2] public initialTokenValues;
    uint256[2] public takeProfit;
    uint256[2] public stopLoss;
    uint256 public threshold;
    uint256 public timePeriod;

    // AggregatorV3Interface internal ethUsdOracle;
    // AggregatorV3Interface internal btcUsdOracle;

    PoolFactory public factory; //temp usesss

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

    // for tempp use
    function setSwapRouter(address _swapRouter) external {
        swapRouter = ISwapRouter(_swapRouter);
    }

    constructor(
        address[2] memory _tokens,
        uint256[2] memory _initialTokenValues,
        uint256[2] memory _proportions,
        uint256 _threshold,
        uint256[2] memory _takeProfit,
        uint256[2] memory _stopLoss,
        uint256 _timePeriod,
        address _owner,
        address _stablecoin,
        address _factory //for temporary
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
        stablecoin = _stablecoin;
        // TO DO : add oracle instances
        swapRouter = ISwapRouter(0x61Ec26aA57019C486B10502285c5A3D4A4750AD7); //need to change this
        factory = PoolFactory(_factory);
    }

    // function fetchPrices() public view returns (uint256[2] memory) {
    //     int256[2] memory rawPrices;
    //     uint256[2] memory prices;

    //     // (, rawPrices[0], , , ) = btcUsdOracle.latestRoundData();
    //     // (, rawPrices[1], , , ) = ethUsdOracle.latestRoundData();

    //     for (uint i = 0; i < 2; i++) {
    //         if (rawPrices[i] < 0) {
    //             prices[i] = uint256(-rawPrices[i]);
    //         } else {
    //             prices[i] = uint256(rawPrices[i]);
    //         }
    //     }

    //     return prices;
    // }

    function fetchPrices() public view returns (uint256[2] memory) {
        uint256[2] memory prices;
        prices[0] = factory.getTokenPrice(tokens[0]);
        prices[1] = factory.getTokenPrice(tokens[1]);
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

    function _checkProfit(
        uint256[2] memory prices
    ) internal view returns (bool[2] memory) {
        bool[2] memory profitReached;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 currentTokenValue = IERC20(tokens[i]).balanceOf(
                address(this)
            ) * prices[i];
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
                uint256 currentTokenValue = IERC20(tokens[i]).balanceOf(
                    address(this)
                ) * prices[i];
                uint256 profit = currentTokenValue - initialTokenValues[i];
                uint256 amountToSwap = (profit / prices[i]) *
                    10 ** getDecimalOfToken(tokens[i]);

                _swapTokens(tokens[i], stablecoin, amountToSwap);
                emit TakeProfitExecuted(tokens[i], amountToSwap);
            }
        }
    }

    function _checkAndExecuteStopLoss(uint256[2] memory prices) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (prices[i] <= stopLoss[i]) {
                uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
                _swapTokens(tokens[i], stablecoin, balance);
                emit StopLossExecuted(tokens[i], balance);
            }
        }
    }

    function _getPoolValue(
        uint256[2] memory prices
    ) internal view returns (uint256) {
        uint256 value = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            value += IERC20(tokens[i]).balanceOf(address(this)) * prices[i];
        }
        return value;
    }

    function getDecimalOfToken(address token) public view returns (uint8) {
        return IERC20(token).decimals();
    }

    function _checkRebalanceNeeded(
        uint256[2] memory prices,
        uint256 poolValue
    ) internal view returns (bool) {
        uint256 valueOfToken0 = IERC20(tokens[0]).balanceOf(address(this)) *
            prices[0];
        uint256 currentPercentage = (valueOfToken0 * MAX_BPS) / poolValue;
        uint256 diffPercentage = currentPercentage > proportions[0]
            ? currentPercentage - proportions[0]
            : proportions[0] - currentPercentage;
        return diffPercentage > threshold;
    }

    function _executeRebalance(
        uint256[2] memory prices,
        uint256 poolValue
    ) internal {
        uint256 valueOfToken0 = IERC20(tokens[0]).balanceOf(address(this)) *
            prices[0];
        uint256 currentPercentage = (valueOfToken0 * MAX_BPS) / poolValue;
        uint256 diffPercentage = currentPercentage > proportions[0]
            ? currentPercentage - proportions[0]
            : proportions[0] - currentPercentage;

        uint256 valueToSwap = (poolValue * diffPercentage) / MAX_BPS;
        uint256 amountToSwap = valueToSwap / prices[0];

        address fromToken = currentPercentage > proportions[0]
            ? tokens[0]
            : tokens[1];
        address toToken = currentPercentage < proportions[0]
            ? tokens[0]
            : tokens[1];
        _swapTokens(
            fromToken,
            toToken,
            amountToSwap * 10 ** getDecimalOfToken(fromToken)
        );
        emit Rebalanced(tokens, proportions);
    }

    function rebalance() public onlyOwner {
        require(
            block.timestamp >= lastChecked + timePeriod,
            "Rebalance: Time period not reached."
        );
        lastChecked = block.timestamp;

        uint256[2] memory prices = fetchPrices();
        uint256 poolValue = _getPoolValue(prices);

        // Check stop-loss conditions
        _checkAndExecuteStopLoss(prices);

        // Check take profit conditions
        bool[2] memory profitReached = _checkProfit(prices);
        _executeTakeProfit(prices, profitReached);

        // Check if rebalance is needed
        bool rebalanceNeeded = _checkRebalanceNeeded(prices, poolValue);

        if (rebalanceNeeded) {
            if (
                (profitReached[0] && !profitReached[1]) ||
                (!profitReached[0] && profitReached[1])
            ) {
                profitReached[0] = !profitReached[0];
                profitReached[1] = !profitReached[1];

                _executeTakeProfit(prices, profitReached);
            } else {
                _executeRebalance(prices, poolValue);
            }
        }
    }

    /**
     * @dev Allows the pool owner to update the threshold value.
     * @param newThreshold The new threshold value for rebalancing.
     */
    function updateThreshold(uint256 newThreshold) public onlyOwner {
        threshold = newThreshold;
    }

    /**
     * @dev Allows the pool owner to update the take profit percentage for a specific asset.
     * @param index The index of the asset in the tokens array (0 or 1).
     * @param newTakeProfit The new take profit percentage for the asset.
     */
    function updateTakeProfit(
        uint256 index,
        uint256 newTakeProfit
    ) external onlyOwner {
        require(index < 2, "Invalid ASset Index.");
        takeProfit[index] = newTakeProfit;
    }

    /**
     * @dev Allows the pool owner to update the stop loss value for a specific asset.
     * @param index The index of the asset in the tokens array (0 or 1).
     * @param newStopLoss The new stop loss value for the asset.
     */
    function updateStopLoss(
        uint256 index,
        uint256 newStopLoss
    ) public onlyOwner {
        require(index < 2, "Invalid asset index.");
        stopLoss[index] = newStopLoss;
    }

    /**
     * @dev Allows the pool owner to withdraw specified amount of tokens from the pool.
     * @param token Address of the token to withdraw.
     * @param amount Amount of tokens to withdraw.
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Withdraw amount must be greater than zero.");
        uint256 contractBalance = IERC20(token).balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient balance to withdraw.");

        IERC20(token).transfer(owner, amount);
        emit TokensWithdrawn(token, amount);
    }

    //need to check that required or not?
    receive() external payable {}
}
