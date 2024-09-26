// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorInterface} from "./Interfaces/AggregatorInterface.sol";

import "./PoolContract.sol";

contract PoolFactory {
    uint256 constant MAX_BPS = 10_000;

    mapping(address => address[]) public userPools; // Mapping to track user-created pools

    event PoolCreated(address poolAddress, address owner, address[2] tokens);

    // TO DO :: Need to add the Create the Oracle instance according to the Token addresses
    AggregatorInterface btcUsdOracle =
        AggregatorInterface(0x3015aa11f5c2D4Bd0f891E708C8927961b38cE7D);
    AggregatorInterface ethUsdOracle =
        AggregatorInterface(0x61Ec26aA57019C486B10502285c5A3D4A4750AD7);

    function createPool(
        address[2] memory tokens,
        uint256[2] memory amounts,
        uint256[2] memory proportions,
        uint256 threshold,
        uint256[2] memory takeProfit,
        uint256[2] memory stopLoss,
        uint256 timePeriod
    ) external {
        require(tokens[0] != address(0), "address should not be zero address");
        require(tokens[1] != address(0), "address should not be zero address");
        require(proportions.length == 2, "Proportions length must be 2.");
        require(stopLoss.length == 2, "Stop-Loss array must be of length 2.");
        require(
            takeProfit.length == 2,
            "take-Profit array must be of length 2."
        );
        require(
            threshold > 0 && threshold <= MAX_BPS,
            "Threshold should be between 0 and 10000 MAX_BPS with basis points considered."
        );
        require(
            takeProfit[0] > threshold && takeProfit[1] > threshold,
            "takeProfit should be greater than threshold"
        );

        uint256[2] memory initialTokenValues;
        uint256[2] memory entryPrices;

        entryPrices = fetchPrices(); //need to change this after testing
        for (uint256 i = 0; i < tokens.length; i++) {
            initialTokenValues[i] =
                (amounts[i] * entryPrices[i]) /
                IERC20(tokens[i]).decimals();
        }

        require(
            stopLoss[0] < entryPrices[0] && stopLoss[1] < entryPrices[1],
            "stop loss price must be less then Entry prices"
        );

        PoolContract newPool = new PoolContract(
            tokens,
            initialTokenValues,
            proportions,
            threshold,
            takeProfit,
            stopLoss,
            timePeriod,
            msg.sender,
            address(btcUsdOracle), //pass the address of oracle of token0
            address(ethUsdOracle) //pass the address of oracle of token1
        );

        for (uint i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).transferFrom(
                msg.sender,
                address(newPool),
                amounts[i]
            );
        }

        userPools[msg.sender].push(address(newPool));

        emit PoolCreated(address(newPool), msg.sender, tokens);
    }

    function fetchPrices() public view returns (uint256[2] memory) {
        int256[2] memory rawPrices;
        uint256[2] memory prices;

        rawPrices[0] = btcUsdOracle.latestAnswer();
        rawPrices[1] = ethUsdOracle.latestAnswer();

        for (uint i = 0; i < 2; i++) {
            if (rawPrices[i] < 0) {
                prices[i] = uint256(-rawPrices[i]);
            } else {
                prices[i] = uint256(rawPrices[i]);
            }
        }

        return prices;
    }

    function getPoolsByUser(
        address user
    ) external view returns (address[] memory) {
        return userPools[user];
    }
}
