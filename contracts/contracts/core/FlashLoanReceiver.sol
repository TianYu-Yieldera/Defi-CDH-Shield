// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IFlashLoanReceiver.sol";
import "../interfaces/IDEXAggregator.sol";

/**
 * @title FlashLoanReceiver
 * @notice Handles Aave V3 flash loan callbacks for CDP protection operations
 * @dev Implements IFlashLoanSimpleReceiver interface for Aave V3
 */
contract FlashLoanReceiver is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Aave V3 Pool address
    address public immutable AAVE_POOL;

    /// @notice CDPShield contract address
    address public cdpShield;

    /// @notice DEX Aggregator for token swaps
    address public dexAggregator;

    /// @notice Operation types for flash loan
    enum OperationType {
        REDUCE_LEVERAGE,
        EMERGENCY_CLOSE
    }

    /// @notice Flash loan operation parameters
    struct FlashLoanParams {
        OperationType operationType;
        uint256 positionId;
        address collateralToken;
        address debtToken;
        uint256 collateralAmount;
        uint256 debtAmount;
        uint256 minAmountOut;
        address positionOwner;
    }

    /// @notice Emitted when a flash loan operation is executed
    event FlashLoanExecuted(
        OperationType indexed operationType,
        uint256 indexed positionId,
        uint256 flashLoanAmount,
        uint256 premium
    );

    /// @notice Emitted when CDPShield address is updated
    event CDPShieldUpdated(address indexed oldAddress, address indexed newAddress);

    /// @notice Emitted when DEX Aggregator address is updated
    event DEXAggregatorUpdated(address indexed oldAddress, address indexed newAddress);

    error InvalidPool();
    error InvalidInitiator();
    error InvalidCDPShield();
    error InvalidDEXAggregator();
    error SwapFailed();
    error InsufficientRepayment();

    /**
     * @notice Constructor
     * @param _aavePool Aave V3 Pool address
     * @param _cdpShield CDPShield contract address
     * @param _dexAggregator DEX Aggregator address
     */
    constructor(
        address _aavePool,
        address _cdpShield,
        address _dexAggregator
    ) Ownable(msg.sender) {
        require(_aavePool != address(0), "Invalid Aave Pool");
        require(_cdpShield != address(0), "Invalid CDPShield");
        require(_dexAggregator != address(0), "Invalid DEX Aggregator");

        AAVE_POOL = _aavePool;
        cdpShield = _cdpShield;
        dexAggregator = _dexAggregator;
    }

    /**
     * @notice Aave V3 flash loan callback
     * @dev Called by Aave Pool after flash loan is received
     * @param asset The address of the flash-borrowed asset
     * @param amount The amount of the flash-borrowed asset
     * @param premium The fee of the flash-borrowed asset
     * @param initiator The address of the flash loan initiator
     * @param params The encoded parameters for the operation
     * @return True if the operation was successful
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external nonReentrant returns (bool) {
        // Verify caller is Aave Pool
        if (msg.sender != AAVE_POOL) {
            revert InvalidPool();
        }

        // Verify initiator is this contract or CDPShield
        if (initiator != address(this) && initiator != cdpShield) {
            revert InvalidInitiator();
        }

        // Decode flash loan parameters
        FlashLoanParams memory flParams = abi.decode(params, (FlashLoanParams));

        // Execute operation based on type
        if (flParams.operationType == OperationType.REDUCE_LEVERAGE) {
            _executeReduceLeverage(asset, amount, premium, flParams);
        } else if (flParams.operationType == OperationType.EMERGENCY_CLOSE) {
            _executeEmergencyClose(asset, amount, premium, flParams);
        }

        // Approve Aave Pool to pull repayment
        uint256 amountOwed = amount + premium;
        IERC20(asset).safeIncreaseAllowance(AAVE_POOL, amountOwed);

        emit FlashLoanExecuted(
            flParams.operationType,
            flParams.positionId,
            amount,
            premium
        );

        return true;
    }

    /**
     * @notice Execute reduce leverage operation
     * @dev Swaps collateral for debt token to repay part of the debt
     * @param asset Flash loaned asset (debt token)
     * @param amount Flash loan amount
     * @param premium Flash loan fee
     * @param params Operation parameters
     */
    function _executeReduceLeverage(
        address asset,
        uint256 amount,
        uint256 premium,
        FlashLoanParams memory params
    ) internal {
        // asset should be the debt token
        require(asset == params.debtToken, "Invalid asset");

        // Calculate total debt to repay including flash loan fee
        uint256 totalDebtNeeded = amount + premium;

        // Transfer collateral from position owner
        IERC20(params.collateralToken).safeTransferFrom(
            params.positionOwner,
            address(this),
            params.collateralAmount
        );

        // Approve DEX aggregator to spend collateral
        IERC20(params.collateralToken).safeIncreaseAllowance(
            dexAggregator,
            params.collateralAmount
        );

        // Swap collateral for debt token
        uint256 debtReceived = IDEXAggregator(dexAggregator).swap(
            params.collateralToken,
            params.debtToken,
            params.collateralAmount,
            params.minAmountOut,
            address(this)
        );

        // Verify we have enough to repay
        if (debtReceived < totalDebtNeeded) {
            revert InsufficientRepayment();
        }

        // Return excess debt tokens to position owner
        uint256 excess = debtReceived - totalDebtNeeded;
        if (excess > 0) {
            IERC20(params.debtToken).safeTransfer(params.positionOwner, excess);
        }
    }

    /**
     * @notice Execute emergency close operation
     * @dev Swaps all collateral for debt token to close position
     * @param asset Flash loaned asset (debt token)
     * @param amount Flash loan amount
     * @param premium Flash loan fee
     * @param params Operation parameters
     */
    function _executeEmergencyClose(
        address asset,
        uint256 amount,
        uint256 premium,
        FlashLoanParams memory params
    ) internal {
        // asset should be the debt token
        require(asset == params.debtToken, "Invalid asset");

        uint256 totalDebtNeeded = amount + premium;

        // Transfer all collateral from position owner
        IERC20(params.collateralToken).safeTransferFrom(
            params.positionOwner,
            address(this),
            params.collateralAmount
        );

        // Approve DEX aggregator
        IERC20(params.collateralToken).safeIncreaseAllowance(
            dexAggregator,
            params.collateralAmount
        );

        // Swap all collateral for debt token
        uint256 debtReceived = IDEXAggregator(dexAggregator).swap(
            params.collateralToken,
            params.debtToken,
            params.collateralAmount,
            params.minAmountOut,
            address(this)
        );

        // Check if we have enough to repay flash loan
        if (debtReceived < totalDebtNeeded) {
            revert InsufficientRepayment();
        }

        // Return excess debt tokens to position owner
        uint256 excess = debtReceived - totalDebtNeeded;
        if (excess > 0) {
            IERC20(params.debtToken).safeTransfer(params.positionOwner, excess);
        }
    }

    /**
     * @notice Update CDPShield address
     * @param _cdpShield New CDPShield address
     */
    function setCDPShield(address _cdpShield) external onlyOwner {
        if (_cdpShield == address(0)) {
            revert InvalidCDPShield();
        }
        address oldAddress = cdpShield;
        cdpShield = _cdpShield;
        emit CDPShieldUpdated(oldAddress, _cdpShield);
    }

    /**
     * @notice Update DEX Aggregator address
     * @param _dexAggregator New DEX Aggregator address
     */
    function setDEXAggregator(address _dexAggregator) external onlyOwner {
        if (_dexAggregator == address(0)) {
            revert InvalidDEXAggregator();
        }
        address oldAddress = dexAggregator;
        dexAggregator = _dexAggregator;
        emit DEXAggregatorUpdated(oldAddress, _dexAggregator);
    }

    /**
     * @notice Emergency withdraw tokens
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
