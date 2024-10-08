// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Interfaces/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./Interfaces/IUniswap.sol";

import "./PoolContract.sol";

contract PoolFactory {
    uint256 constant MAX_BPS = 10_000;
    address immutable stableCoin = 0xECa9bC828A3005B9a3b909f2cc5c2a54794DE05F;
    address public immutable uniswapFactory = 0xCAc0EE410E19a12ccE8805d5374Bb60200fAdd03;

    mapping(address => address[]) public userPools;
    mapping(address => address) public tokenPoolAddresses;

    address[] public operators;
    mapping(address => bool) public isOperator;

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

    modifier onlyOperator() {
        require(isOperator[msg.sender], "You are not the operator");
        _;
    }

    constructor() {
        operators.push(0xd13b85D23eFdEa60F8B84571254D6bBD7915cDe8);
        isOperator[0xd13b85D23eFdEa60F8B84571254D6bBD7915cDe8] = true;
    }

    function setPoolAddresses() external onlyOperator {
        tokenPoolAddresses[0xe1B8d3435d25aBEc5986A2ddE4E32cC193e5d2F0] = IUniswapV3Factory(uniswapFactory).getPool(
            0xe1B8d3435d25aBEc5986A2ddE4E32cC193e5d2F0, // SYNC X address
            stableCoin,
            3000
        );
        tokenPoolAddresses[0xca319A9a1F5E0e2EAcfF6455Dc304096aBBEDd6B] = IUniswapV3Factory(uniswapFactory).getPool(
            0xca319A9a1F5E0e2EAcfF6455Dc304096aBBEDd6B, // SYNC Y address
            stableCoin,
            3000
        );
        tokenPoolAddresses[0xaCF2a4d6a04AA8b57aB7042AdDD1eFFB8Cd50833] = IUniswapV3Factory(uniswapFactory).getPool(
            0xaCF2a4d6a04AA8b57aB7042AdDD1eFFB8Cd50833, // SYNC Z address
            stableCoin,
            3000
        );
    }

    function getOnChainPrice(
        address token
    ) public view returns (uint256 price) {
        address tokenPoolAddress = tokenPoolAddresses[token];
        require(tokenPoolAddress != address(0), "Pool not found");
        
        IUniswapV3Pool tokenPool = IUniswapV3Pool(tokenPoolAddress);

        (uint160 sqrtPriceX96, , , , , , ) = tokenPool.slot0(); 

        price = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) * (1e6) / (1 << 192);
    }

    function testPrice(
         address token
    ) public view returns (uint160 sqrtPriceX96) {
        address tokenPoolAddress = tokenPoolAddresses[token];
        require(tokenPoolAddress != address(0), "Pool not found");
        
        IUniswapV3Pool tokenPool = IUniswapV3Pool(tokenPoolAddress);

        (sqrtPriceX96, , , , , , ) = tokenPool.slot0();
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

        PoolContract newPool = new PoolContract(
            address(this),
            params.tokens,
            _calculateInitialTokenValues(params.tokens, params.amounts),
            params.proportions,
            params.threshold,
            params.takeProfit,
            params.stopLoss,
            params.timePeriod,
            msg.sender
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

        uint256 priceTokenFrom = getOnChainPrice(tokenFrom);
        uint256 priceTokenTo = getOnChainPrice(tokenTo);
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
            uint256 entryPrice = getOnChainPrice(tokens[i]);
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
                (amounts[i] * getOnChainPrice(tokens[i])) /
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

    function getDecimalOfToken(address token) public view returns (uint8) {
        return IERC20Metadata(token).decimals();
    }

    function getPoolsByUser(
        address user
    ) external view returns (address[] memory) {
        return userPools[user];
    }

    function addOperator(address _newOperator) external onlyOperator {
        operators.push(_newOperator);
        isOperator[_newOperator] = true;
    }

}
// THBfkWjoJqY7appwUmtHrNkAHhZR46Cj5n new factory address
