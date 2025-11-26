// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IDEXAggregator
 * @notice Interface for DEX Aggregator contract
 * @dev Aggregates liquidity from multiple DEXs and finds optimal swap routes
 */
interface IDEXAggregator {
    // Structs
    struct SwapRoute {
        address dex;
        address[] path;
        uint256 expectedOutput;
        uint256 gasEstimate;
    }

    struct QuoteParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        address[] dexList;
    }

    // Events
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address dex
    );

    event DEXAdded(address indexed dex, string name);

    event DEXRemoved(address indexed dex);

    event SlippageExceeded(
        address indexed user,
        uint256 expectedAmount,
        uint256 actualAmount,
        uint256 slippage
    );

    // Main Functions
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut);

    function swapWithRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        SwapRoute calldata route,
        address recipient
    ) external returns (uint256 amountOut);

    // Quote Functions
    function getBestQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (SwapRoute memory bestRoute);

    function getQuotes(
        QuoteParams calldata params
    ) external view returns (SwapRoute[] memory routes);

    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address dex
    ) external view returns (uint256 amountOut);

    // Admin Functions
    function addDEX(address dex, string calldata name) external;

    function removeDEX(address dex) external;

    function addAllowedToken(address token) external;

    function removeAllowedToken(address token) external;

    // View Functions
    function getAllowedDEXs() external view returns (address[] memory);

    function getAllowedTokens() external view returns (address[] memory);

    function isDEXAllowed(address dex) external view returns (bool);

    function isTokenAllowed(address token) external view returns (bool);

    function getMaxSlippage() external view returns (uint256);
}
