// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./PoolContract.sol"; // Import the pool contract

contract PoolFactory {
    uint256 constant MAX_BPS = 10_000;

    mapping(address => uint256) public tokenPrices; //for tempp use

    mapping(address => address[]) public userPools; // Mapping to track user-created pools

    event PoolCreated(address poolAddress, address owner, address[2] tokens);

    // address immutable stableCoin = address(0); // NEED TO ADD STABLE COIN ADDRESS
    address public stableCoin; // NEED TO ADD STABLE COIN ADDRESS

    // TO DO : add Oracle instances for TRON mainnet/Nile testnet

    //for tempp use
    function setTokenPrice(address token, uint256 price) external {
        tokenPrices[token] = price;
    }

    

    //for tempp use
    function getTokenPrice(address token) public view returns (uint256) {
        return tokenPrices[token];
    }

    function setStableCoin(address token) external {
        stableCoin = token;
    }

    function createPool(
        address[2] memory tokens,
        uint256[2] memory amounts,
        uint256[2] memory proportions,
        uint256 threshold,
        uint256[2] memory takeProfit,
        uint256[2] memory stopLoss,
        uint256 timePeriod
    ) external {
        require(tokens.length == 2, "Only 2 tokens allowed.");
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

        // entryPrices = fetchPrices(); //need to change this after testing
        // for (uint256 i = 0; i < tokens.length; i++) {
        //     initialTokenValues[i] = amounts[i] * entryPrices[i];
        // }
        ////////
        // for temppp need to check and change
        for (uint256 i = 0; i < tokens.length; i++) {
            entryPrices[i] = getTokenPrice(tokens[i]);
            require(entryPrices[i] > 0, "Token price not set");
            initialTokenValues[i] = amounts[i] * entryPrices[i];
        }
        ////////
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
            stableCoin,
            address(this)
        );

        userPools[msg.sender].push(address(newPool));

        emit PoolCreated(address(newPool), msg.sender, tokens);
    }

    // function fetchPrices() public view returns (uint256[2] memory) {
    //     // int256[2] memory rawPrices;
    //     uint256[2] memory prices;

    //     // (, rawPrices[0], , , ) = btcUsdOracle.latestRoundData();
    //     // (, rawPrices[1], , , ) = ethUsdOracle.latestRoundData();

    //     // for (uint i = 0; i < 2; i++) {
    //     //     if (rawPrices[i] < 0) {
    //     //         prices[i] = uint256(-rawPrices[i]);
    //     //     } else {
    //     //         prices[i] = uint256(rawPrices[i]);
    //     //     }
    //     // }

    //     return prices;
    // }

    function getPoolsByUser(
        address user
    ) external view returns (address[] memory) {
        return userPools[user];
    }
}
