// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/OracleInterface.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

/// @title PoolContract for automated portfolio management
/// @notice This contract manages a pool of two tokens with automated rebalancing, take-profit, and stop-loss features
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

    uint256 constant MAX_BPS = 10_000; // Base points for percentage calculations

    ISwapRouter public swapRouter;
    uint256 public lastChecked;

    /// @notice Restricts function access to the pool owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the pool owner.");
        _;
    }

    /// @notice Emitted when tokens are rebalanced
    /// @param tokens Array of token addresses
    /// @param proportions Array of new token proportions
    event Rebalanced(address[2] tokens, uint256[2] proportions);

    /// @notice Emitted when take-profit actions are executed
    /// @param token Address of the token for which take-profit was executed
    /// @param amountConverted Amount of tokens converted to stablecoin
    event TakeProfitExecuted(address token, uint256 amountConverted);

    /// @notice Emitted when stop-loss actions are executed
    /// @param token Address of the token for which stop-loss was executed
    /// @param amountConverted Amount of tokens converted to stablecoin
    event StopLossExecuted(address token, uint256 amountConverted);

    /// @notice Initializes a new PoolContract instance
    /// @param _tokens Array of two token addresses in the pool
    /// @param _initialTokenValues Initial values of the tokens
    /// @param _proportions Array of initial token proportions
    /// @param _threshold Threshold percentage for rebalancing actions
    /// @param _takeProfit Array of take-profit percentages for each token
    /// @param _stopLoss Array of stop-loss values for each token
    /// @param _timePeriod Time period for regular rebalancing checks
    /// @param _owner Address of the pool owner
    /// @param _stablecoin Address of the stablecoin used for profit taking and stop-loss
    constructor(
        address[2] memory _tokens,
        uint256[2] memory _initialTokenValues,
        uint256[2] memory _proportions,
        uint256 _threshold,
        uint256[2] memory _takeProfit,
        uint256[2] memory _stopLoss,
        uint256 _timePeriod,
        address _owner,
        address _stablecoin
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
    }

    /// @notice Fetches real-time prices of tokens in the pool
    /// @return Array of current token prices
    function fetchPrices() public view returns (uint256[2] memory) {
        uint256[2] memory prices;
        for (uint256 i = 0; i < tokens.length; i++) {
            // Replace this with actual oracle implementation
            prices[i] = 10; // Placeholder
        }
        return prices;
    }

    /// @notice Swaps tokens using the Uniswap router
    /// @param tokenIn Address of the input token
    /// @param tokenOut Address of the output token
    /// @param amountIn Amount of the input token to swap
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

    /// @notice Checks if take-profit conditions are met for each token
    /// @param prices Current prices of the tokens
    /// @return Array of booleans indicating if take-profit is triggered for each token
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

    /// @notice Executes take-profit actions for tokens that have reached their profit targets
    /// @param prices Current prices of the tokens
    /// @param profitReached Array indicating which tokens have reached their profit targets
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

    /// @notice Checks and executes stop-loss actions for tokens that have fallen below their stop-loss levels
    /// @param prices Current prices of the tokens
    function _checkAndExecuteStopLoss(uint256[2] memory prices) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (prices[i] <= stopLoss[i]) {
                uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
                _swapTokens(tokens[i], stablecoin, balance);
                emit StopLossExecuted(tokens[i], balance);
            }
        }
    }

    /// @notice Calculates the current total value of the pool
    /// @param prices Current prices of the tokens
    /// @return Total value of the pool
    function _getPoolValue(
        uint256[2] memory prices
    ) internal view returns (uint256) {
        uint256 value = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            value += IERC20(tokens[i]).balanceOf(address(this)) * prices[i];
        }
        return value;
    }

    /// @notice Retrieves the number of decimals for a given token
    /// @param token Address of the token
    /// @return Number of decimals for the token
    function getDecimalOfToken(address token) public view returns (uint8) {
        return IERC20(token).decimals();
    }

    /// @notice Checks if rebalancing is needed based on current token proportions
    /// @param prices Current prices of the tokens
    /// @param poolValue Total value of the pool
    /// @return Boolean indicating if rebalancing is needed
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

    /// @notice Executes the rebalancing of tokens to match target proportions
    /// @param prices Current prices of the tokens
    /// @param poolValue Total value of the pool
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

    /// @notice Main function to check and execute rebalancing, take-profit, and stop-loss actions
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

    /// @notice Allows the contract to receive ETH
    /// @dev This function is currently empty and may need to be implemented or removed based on requirements
    receive() external payable {}
}