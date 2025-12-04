// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IDEXAggregator.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockDEXAggregator
 * @notice Mock DEX Aggregator for testing
 * @dev Simulates token swaps with configurable exchange rates
 */
contract MockDEXAggregator is IDEXAggregator, Ownable {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public exchangeRates;
    mapping(address => bool) public allowedDEXs;
    mapping(address => bool) public allowedTokens;
    uint256 public maxSlippage;

    address[] private _dexList;
    address[] private _tokenList;

    constructor() Ownable(msg.sender) {
        maxSlippage = 300;
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external override returns (uint256 amountOut) {
        require(allowedTokens[tokenIn], "Token in not allowed");
        require(allowedTokens[tokenOut], "Token out not allowed");
        require(amountIn > 0, "Invalid amount");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 rate = exchangeRates[tokenIn][tokenOut];
        require(rate > 0, "Exchange rate not set");

        amountOut = (amountIn * rate) / 1e18;
        require(amountOut >= minAmountOut, "Slippage too high");

        IERC20(tokenOut).safeTransfer(recipient, amountOut);

        emit SwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            address(this)
        );

        return amountOut;
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function swapWithRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        SwapRoute calldata,
        address recipient
    ) external override returns (uint256 amountOut) {
        return this.swap(tokenIn, tokenOut, amountIn, minAmountOut, recipient);
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function getBestQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view override returns (SwapRoute memory bestRoute) {
        uint256 amountOut = this.getAmountOut(tokenIn, tokenOut, amountIn, address(0));

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        bestRoute = SwapRoute({
            dex: address(this),
            path: path,
            expectedOutput: amountOut,
            gasEstimate: 100000
        });

        return bestRoute;
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function getQuotes(
        QuoteParams calldata params
    ) external view override returns (SwapRoute[] memory routes) {
        routes = new SwapRoute[](1);
        routes[0] = this.getBestQuote(params.tokenIn, params.tokenOut, params.amountIn);
        return routes;
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address
    ) external view override returns (uint256 amountOut) {
        uint256 rate = exchangeRates[tokenIn][tokenOut];
        if (rate == 0) return 0;
        return (amountIn * rate) / 1e18;
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function addDEX(address dex, string calldata name) external override onlyOwner {
        require(dex != address(0), "Invalid DEX");
        require(!allowedDEXs[dex], "DEX already added");

        allowedDEXs[dex] = true;
        _dexList.push(dex);

        emit DEXAdded(dex, name);
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function removeDEX(address dex) external override onlyOwner {
        require(allowedDEXs[dex], "DEX not found");

        allowedDEXs[dex] = false;

        for (uint256 i = 0; i < _dexList.length; i++) {
            if (_dexList[i] == dex) {
                _dexList[i] = _dexList[_dexList.length - 1];
                _dexList.pop();
                break;
            }
        }

        emit DEXRemoved(dex);
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function addAllowedToken(address token) external override onlyOwner {
        require(token != address(0), "Invalid token");
        require(!allowedTokens[token], "Token already allowed");

        allowedTokens[token] = true;
        _tokenList.push(token);
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function removeAllowedToken(address token) external override onlyOwner {
        require(allowedTokens[token], "Token not found");

        allowedTokens[token] = false;

        for (uint256 i = 0; i < _tokenList.length; i++) {
            if (_tokenList[i] == token) {
                _tokenList[i] = _tokenList[_tokenList.length - 1];
                _tokenList.pop();
                break;
            }
        }
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function getAllowedDEXs() external view override returns (address[] memory) {
        return _dexList;
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function getAllowedTokens() external view override returns (address[] memory) {
        return _tokenList;
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function isDEXAllowed(address dex) external view override returns (bool) {
        return allowedDEXs[dex];
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function isTokenAllowed(address token) external view override returns (bool) {
        return allowedTokens[token];
    }

    /**
     * @inheritdoc IDEXAggregator
     */
    function getMaxSlippage() external view override returns (uint256) {
        return maxSlippage;
    }

    /**
     * @notice Set exchange rate between two tokens
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param rate Exchange rate (18 decimals)
     */
    function setExchangeRate(
        address tokenIn,
        address tokenOut,
        uint256 rate
    ) external onlyOwner {
        require(tokenIn != address(0), "Invalid token in");
        require(tokenOut != address(0), "Invalid token out");
        require(rate > 0, "Invalid rate");

        exchangeRates[tokenIn][tokenOut] = rate;
    }

    /**
     * @notice Set max slippage tolerance
     * @param _maxSlippage New max slippage (basis points)
     */
    function setMaxSlippage(uint256 _maxSlippage) external onlyOwner {
        require(_maxSlippage <= 10000, "Invalid slippage");
        maxSlippage = _maxSlippage;
    }

    /**
     * @notice Deposit tokens to the aggregator for testing
     * @param token Token to deposit
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Withdraw tokens from the aggregator (owner only)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
