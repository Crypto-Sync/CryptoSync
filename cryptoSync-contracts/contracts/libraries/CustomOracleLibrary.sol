// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../Interfaces/IUniswap.sol";

library CustomOracleLibrary {
    // Helper function to calculate power of 2
    function powTwo(uint8 exp) internal pure returns (uint256) {
        return 1 << exp;
    }

    // Helper function to safely convert negative tick to positive uint
    function abs(int24 x) internal pure returns (uint24) {
        return x < 0 ? uint24(-int24(x)) : uint24(x);
    }

    function consultPrice(
        address pool,
        uint32 secondsAgo
    ) public view returns (uint256 price) {
        require(pool != address(0), "Pool not found");
        
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = secondsAgo;
        secondsAgos[1] = 0;

        IUniswapV3Pool uniswapPool = IUniswapV3Pool(pool);
        (int56[] memory tickCumulatives, ) = uniswapPool.observe(secondsAgos);

        int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];
        int24 timeWeightedAverageTick = int24(tickCumulativesDelta / int56(uint56(secondsAgo)));

        // Convert tick to price using a simplified calculation
        uint256 basePrice = 1e18;
        uint256 ratio = 1e18;

        uint24 absoluteTick = abs(timeWeightedAverageTick);
        
        // Ensure tick is within reasonable bounds for conversion to uint8
        require(absoluteTick <= 255, "Tick out of bounds");
        uint8 tickPower = uint8(absoluteTick);

        if (timeWeightedAverageTick < 0) {
            // For negative ticks, we divide by power of 2
            if (absoluteTick > 0) {
                ratio = (ratio * 1e18) / powTwo(tickPower);
            }
            price = (basePrice * 1e18) / ratio;
        } else {
            // For positive ticks, we multiply by power of 2
            if (absoluteTick > 0) {
                ratio = ratio * powTwo(tickPower);
            }
            price = (basePrice * ratio) / 1e18;
        }

        return price;
    }
}
