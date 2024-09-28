// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {AggregatorInterface} from "./Interfaces/AggregatorInterface.sol";

import "./PoolContract.sol";

contract PoolFactory {
    uint256 constant MAX_BPS = 10_000;

    mapping(address => address[]) public userPools;
    mapping(address => address) public tokenToOracle;

    event PoolCreated(address poolAddress, address owner, address[2] tokens);

    struct PoolParams {
        address[2] tokens;
        uint256[2] amounts;
        uint256[2] proportions;
        uint256 threshold;
        uint256[2] takeProfit;
        uint256[2] stopLoss;
        uint256 timePeriod;
    }

    constructor() {
        tokenToOracle[
            0xf0B604C851644B6ab9D9453B739A5C07725E4ecA
        ] = 0x060976B5b94b816b8Ff709A4c16A9b3D3Cbe2D95; // BTC/USD Oracle
        tokenToOracle[
            0xD2bD2f2eA43DE2f7Bc98D2656c8e5Be7e88c7f2D
        ] = 0x9CEE01f7c133D041c90EbAc2D0134CE864110c53; // ETH/USD Oracle
        tokenToOracle[
            0x6E6c24c305c2d22d2096Ea2Ea354C92Ca1B389F9
        ] = 0x9CEE01f7c133D041c90EbAc2D0134CE864110c53; // TRX/USD Oracle (placeholder)
    }

    function createPool(PoolParams memory params) external {
        _validatePoolParams(params);
        _validateAmounts(
            params.tokens,
            params.amounts,
            params.proportions,
            params.threshold
        );
        _validatePrices(params.tokens, params.stopLoss);

        address[2] memory oracleAddresses = [
            tokenToOracle[params.tokens[0]],
            tokenToOracle[params.tokens[1]]
        ];

        PoolContract newPool = new PoolContract(
            params.tokens,
            _calculateInitialTokenValues(params.tokens, params.amounts),
            params.proportions,
            params.threshold,
            params.takeProfit,
            params.stopLoss,
            params.timePeriod,
            msg.sender,
            oracleAddresses[0],
            oracleAddresses[1]
        );

        _transferTokens(params.tokens, params.amounts, address(newPool));
        userPools[msg.sender].push(address(newPool));
        emit PoolCreated(address(newPool), msg.sender, params.tokens);
    }

    function _validatePoolParams(PoolParams memory params) internal pure {
        require(
            params.tokens[0] != address(0) && params.tokens[1] != address(0),
            "Invalid token address"
        );
        require(
            params.threshold > 0 && params.threshold <= MAX_BPS,
            "Invalid threshold"
        );
        require(
            params.takeProfit[0] > params.threshold &&
                params.takeProfit[1] > params.threshold,
            "Invalid takeProfit"
        );
    }

    function getTokenPrice(address token) public view returns (uint256) {
        address oracleAddress = tokenToOracle[token];
        require(oracleAddress != address(0), "Oracle not set for this token");

        AggregatorInterface oracle = AggregatorInterface(oracleAddress);
        int256 rawPrice = oracle.latestAnswer();
        uint256 price = rawPrice < 0 ? uint256(-rawPrice) : uint256(rawPrice);

        return price;
    }

    function getAmountRequired(
        address tokenFrom,
        address tokenTo,
        uint256 amountToProvide,
        uint256 tokenPercentage
    ) public view returns (uint256) {
        require(
            tokenFrom != address(0) && tokenTo != address(0),
            "Invalid token address"
        );

        uint256 priceTokenFrom = getTokenPrice(tokenFrom);
        uint256 priceTokenTo = getTokenPrice(tokenTo);
        require(
            priceTokenFrom > 0 && priceTokenTo > 0,
            "Token prices not available"
        );

        uint256 decimalsTokenFrom = IERC20Metadata(tokenFrom).decimals();
        uint256 decimalsTokenTo = IERC20Metadata(tokenTo).decimals();

        uint256 fromTokenValue = (amountToProvide * priceTokenFrom) /
            10 ** decimalsTokenFrom;
        uint256 toTokenValueRequired = ((MAX_BPS - tokenPercentage) *
            fromTokenValue) / tokenPercentage;

        return (toTokenValueRequired * 10 ** decimalsTokenTo) / priceTokenTo;
    }

    function _validateAmounts(
        address[2] memory tokens,
        uint256[2] memory amounts,
        uint256[2] memory proportions,
        uint256 threshold
    ) internal view {
        uint256 expectedAmount1 = getAmountRequired(
            tokens[0],
            tokens[1],
            amounts[0],
            proportions[0]
        );
        uint256 difference = expectedAmount1 > amounts[1]
            ? expectedAmount1 - amounts[1]
            : amounts[1] - expectedAmount1;
        uint256 allowedDifference = (expectedAmount1 * threshold) / MAX_BPS;
        require(
            difference <= allowedDifference,
            "Amounts do not match proportions within threshold"
        );
    }

    function _validatePrices(
        address[2] memory tokens,
        uint256[2] memory stopLoss
    ) internal view {
        for (uint256 i = 0; i < 2; i++) {
            uint256 entryPrice = getTokenPrice(tokens[i]);
            require(entryPrice > 0, "Token price not available");
            require(
                stopLoss[i] < entryPrice,
                "Stop loss must be less than entry price"
            );
        }
    }

    function _calculateInitialTokenValues(
        address[2] memory tokens,
        uint256[2] memory amounts
    ) internal view returns (uint256[2] memory) {
        uint256[2] memory values;
        for (uint256 i = 0; i < 2; i++) {
            values[i] =
                (amounts[i] * getTokenPrice(tokens[i])) /
                10 ** IERC20Metadata(tokens[i]).decimals();
        }
        return values;
    }

    function _transferTokens(
        address[2] memory tokens,
        uint256[2] memory amounts,
        address recipient
    ) internal {
        for (uint256 i = 0; i < 2; i++) {
            IERC20(tokens[i]).transferFrom(msg.sender, recipient, amounts[i]);
        }
    }

    function getPoolsByUser(
        address user
    ) external view returns (address[] memory) {
        return userPools[user];
    }
}
