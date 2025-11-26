// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPriceOracle
 * @notice Interface for price oracle
 * @dev Provides price feeds for tokens
 */
interface IPriceOracle {
    /**
     * @notice Get the price of a token in USD (18 decimals)
     * @param token The token address
     * @return price The price in USD with 18 decimals
     */
    function getPrice(address token) external view returns (uint256 price);

    /**
     * @notice Get the price of multiple tokens
     * @param tokens Array of token addresses
     * @return prices Array of prices in USD with 18 decimals
     */
    function getPrices(address[] calldata tokens) external view returns (uint256[] memory prices);

    /**
     * @notice Check if a price feed is stale
     * @param token The token address
     * @return isStale True if the price feed is stale
     */
    function isPriceStale(address token) external view returns (bool isStale);

    /**
     * @notice Get the last update timestamp for a token
     * @param token The token address
     * @return timestamp The last update timestamp
     */
    function getLastUpdate(address token) external view returns (uint256 timestamp);
}
