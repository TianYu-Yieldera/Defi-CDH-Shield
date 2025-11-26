// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICDPShield
 * @notice Interface for CDP Shield main contract
 * @dev Manages CDP positions and provides protection mechanisms
 */
interface ICDPShield {
    // Enums
    enum PositionStatus {
        Active,
        Closing,
        Closed
    }

    enum Action {
        REDUCE_LEVERAGE,
        PARTIAL_CLOSE,
        FULL_CLOSE,
        EMERGENCY_CLOSE
    }

    // Structs
    struct Position {
        address owner;
        address protocol;
        address collateralToken;
        address debtToken;
        uint256 collateralAmount;
        uint256 debtAmount;
        uint256 healthFactor;
        PositionStatus status;
        uint256 lastUpdated;
    }

    struct SwapParams {
        address dexAggregator;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        bytes swapData;
    }

    // Events
    event PositionRegistered(
        uint256 indexed positionId,
        address indexed owner,
        address protocol,
        address collateralToken,
        address debtToken
    );

    event LeverageReduced(
        uint256 indexed positionId,
        uint256 debtRepaid,
        uint256 collateralReduced,
        uint256 newHealthFactor
    );

    event PartialClose(
        uint256 indexed positionId,
        uint256 percentage,
        uint256 collateralWithdrawn,
        uint256 debtRepaid
    );

    event FullClose(
        uint256 indexed positionId,
        uint256 collateralReturned,
        uint256 debtRepaid
    );

    event EmergencyClose(
        uint256 indexed positionId,
        uint256 timestamp
    );

    event PositionUpdated(
        uint256 indexed positionId,
        uint256 healthFactor
    );

    // Main Functions
    function registerPosition(
        address protocol,
        address collateralToken,
        address debtToken,
        uint256 collateralAmount,
        uint256 debtAmount
    ) external returns (uint256 positionId);

    function reduceLeverage(
        uint256 positionId,
        uint256 debtToRepay,
        SwapParams calldata swapParams
    ) external returns (uint256 newHealthFactor);

    function partialClose(
        uint256 positionId,
        uint256 percentage,
        SwapParams calldata swapParams
    ) external returns (uint256 collateralWithdrawn, uint256 debtRepaid);

    function fullClose(
        uint256 positionId,
        SwapParams calldata swapParams
    ) external returns (uint256 collateralReturned);

    function emergencyClose(
        uint256 positionId,
        SwapParams calldata swapParams
    ) external returns (bool success);

    function updatePosition(
        uint256 positionId,
        uint256 newCollateralAmount,
        uint256 newDebtAmount
    ) external;

    // View Functions
    function getPosition(uint256 positionId) external view returns (Position memory);

    function getUserPositions(address user) external view returns (uint256[] memory);

    function calculateHealthFactor(
        uint256 collateralAmount,
        uint256 debtAmount,
        address collateralToken,
        address debtToken
    ) external view returns (uint256);

    function getPositionCount() external view returns (uint256);

    function isPaused() external view returns (bool);
}
