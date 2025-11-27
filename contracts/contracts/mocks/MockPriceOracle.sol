// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPriceOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPriceOracle
 * @notice Mock price oracle for testing
 * @dev Allows manual price updates for testing
 */
contract MockPriceOracle is IPriceOracle, Ownable {
    // Token address => Price in USD (18 decimals)
    mapping(address => uint256) private prices;

    // Token address => Last update timestamp
    mapping(address => uint256) private lastUpdates;

    // Maximum age before price is considered stale (1 hour)
    uint256 public constant MAX_PRICE_AGE = 1 hours;

    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set price for a token
     * @param token Token address
     * @param price Price in USD (18 decimals)
     */
    function setPrice(address token, uint256 price) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(price > 0, "Invalid price");

        prices[token] = price;
        lastUpdates[token] = block.timestamp;

        emit PriceUpdated(token, price, block.timestamp);
    }

    /**
     * @notice Set prices for multiple tokens
     * @param tokens Array of token addresses
     * @param _prices Array of prices
     */
    function setPrices(
        address[] calldata tokens,
        uint256[] calldata _prices
    ) external onlyOwner {
        require(tokens.length == _prices.length, "Length mismatch");

        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token");
            require(_prices[i] > 0, "Invalid price");

            prices[tokens[i]] = _prices[i];
            lastUpdates[tokens[i]] = block.timestamp;

            emit PriceUpdated(tokens[i], _prices[i], block.timestamp);
        }
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function getPrice(address token) external view override returns (uint256 price) {
        price = prices[token];
        require(price > 0, "Price not set");
        return price;
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function getPrices(
        address[] calldata tokens
    ) external view override returns (uint256[] memory) {
        uint256[] memory result = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            result[i] = prices[tokens[i]];
            require(result[i] > 0, "Price not set");
        }

        return result;
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function isPriceStale(address token) external view override returns (bool) {
        if (lastUpdates[token] == 0) return true;
        return block.timestamp - lastUpdates[token] > MAX_PRICE_AGE;
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function getLastUpdate(address token) external view override returns (uint256) {
        return lastUpdates[token];
    }
}
