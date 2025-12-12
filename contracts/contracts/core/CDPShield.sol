// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ICDPShield.sol";
import "../interfaces/IPriceOracle.sol";
import "../interfaces/IDEXAggregator.sol";
import "../interfaces/IFlashLoanReceiver.sol";

/**
 * @title CDPShield
 * @notice Main contract for CDP position management and protection
 * @dev Implements position tracking, leverage management, and emergency closure mechanisms
 */
contract CDPShield is ICDPShield, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    uint256 private constant PERCENTAGE_BASE = 10000;
    uint256 private constant HEALTH_FACTOR_PRECISION = 1e18;
    uint256 private constant LIQUIDATION_THRESHOLD = 1.1e18;
    uint256 private constant MIN_HEALTH_FACTOR = 1.05e18;

    IPriceOracle public priceOracle;
    IDEXAggregator public dexAggregator;
    address public aavePool;
    address public flashLoanReceiver;

    uint256 private _positionIdCounter;

    mapping(uint256 => Position) private _positions;
    mapping(address => uint256[]) private _userPositions;

    modifier onlyPositionOwner(uint256 positionId) {
        require(_positions[positionId].owner == msg.sender, "Not position owner");
        _;
    }

    modifier positionExists(uint256 positionId) {
        require(_positions[positionId].owner != address(0), "Position does not exist");
        _;
    }

    modifier positionActive(uint256 positionId) {
        require(_positions[positionId].status == PositionStatus.Active, "Position not active");
        _;
    }

    constructor(address _priceOracle, address _dexAggregator) Ownable(msg.sender) {
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_dexAggregator != address(0), "Invalid DEX aggregator");

        priceOracle = IPriceOracle(_priceOracle);
        dexAggregator = IDEXAggregator(_dexAggregator);
    }

    /**
     * @inheritdoc ICDPShield
     */
    function registerPosition(
        address protocol,
        address collateralToken,
        address debtToken,
        uint256 collateralAmount,
        uint256 debtAmount
    ) external override whenNotPaused returns (uint256 positionId) {
        require(protocol != address(0), "Invalid protocol");
        require(collateralToken != address(0), "Invalid collateral token");
        require(debtToken != address(0), "Invalid debt token");
        require(collateralAmount > 0, "Invalid collateral amount");
        require(debtAmount > 0, "Invalid debt amount");

        uint256 healthFactor = calculateHealthFactor(
            collateralAmount,
            debtAmount,
            collateralToken,
            debtToken
        );

        require(healthFactor >= MIN_HEALTH_FACTOR, "Health factor too low");

        positionId = ++_positionIdCounter;

        _positions[positionId] = Position({
            owner: msg.sender,
            protocol: protocol,
            collateralToken: collateralToken,
            debtToken: debtToken,
            collateralAmount: collateralAmount,
            debtAmount: debtAmount,
            healthFactor: healthFactor,
            status: PositionStatus.Active,
            lastUpdated: block.timestamp
        });

        _userPositions[msg.sender].push(positionId);

        emit PositionRegistered(
            positionId,
            msg.sender,
            protocol,
            collateralToken,
            debtToken
        );

        return positionId;
    }

    /**
     * @inheritdoc ICDPShield
     */
    function reduceLeverage(
        uint256 positionId,
        uint256 debtToRepay,
        SwapParams calldata swapParams
    )
        external
        override
        nonReentrant
        whenNotPaused
        positionExists(positionId)
        onlyPositionOwner(positionId)
        positionActive(positionId)
        returns (uint256 newHealthFactor)
    {
        require(debtToRepay > 0, "Invalid debt amount");

        Position storage position = _positions[positionId];
        require(debtToRepay <= position.debtAmount, "Exceeds debt amount");

        _validateSwapParams(swapParams, position.collateralToken, position.debtToken);

        uint256 collateralToSell = _calculateCollateralNeeded(
            debtToRepay,
            position.collateralToken,
            position.debtToken
        );

        require(collateralToSell <= position.collateralAmount, "Insufficient collateral");

        IERC20(position.collateralToken).safeTransferFrom(
            msg.sender,
            address(this),
            collateralToSell
        );

        IERC20(position.collateralToken).safeIncreaseAllowance(
            swapParams.dexAggregator,
            collateralToSell
        );

        uint256 debtTokenReceived = IDEXAggregator(swapParams.dexAggregator).swap(
            position.collateralToken,
            position.debtToken,
            collateralToSell,
            swapParams.minAmountOut,
            address(this)
        );

        require(debtTokenReceived >= debtToRepay, "Insufficient swap output");

        position.collateralAmount -= collateralToSell;
        position.debtAmount -= debtToRepay;
        position.lastUpdated = block.timestamp;

        newHealthFactor = calculateHealthFactor(
            position.collateralAmount,
            position.debtAmount,
            position.collateralToken,
            position.debtToken
        );

        position.healthFactor = newHealthFactor;

        emit LeverageReduced(
            positionId,
            debtToRepay,
            collateralToSell,
            newHealthFactor
        );

        return newHealthFactor;
    }

    /**
     * @inheritdoc ICDPShield
     */
    function partialClose(
        uint256 positionId,
        uint256 percentage,
        SwapParams calldata swapParams
    )
        external
        override
        nonReentrant
        whenNotPaused
        positionExists(positionId)
        onlyPositionOwner(positionId)
        positionActive(positionId)
        returns (uint256 collateralWithdrawn, uint256 debtRepaid)
    {
        require(percentage > 0 && percentage < PERCENTAGE_BASE, "Invalid percentage");

        Position storage position = _positions[positionId];

        _validateSwapParams(swapParams, position.collateralToken, position.debtToken);

        debtRepaid = (position.debtAmount * percentage) / PERCENTAGE_BASE;
        uint256 collateralToUse = (position.collateralAmount * percentage) / PERCENTAGE_BASE;

        require(debtRepaid > 0 && collateralToUse > 0, "Amounts too small");

        uint256 collateralNeededForDebt = _calculateCollateralNeeded(
            debtRepaid,
            position.collateralToken,
            position.debtToken
        );

        require(collateralNeededForDebt <= collateralToUse, "Insufficient collateral for swap");

        IERC20(position.collateralToken).safeTransferFrom(
            msg.sender,
            address(this),
            collateralNeededForDebt
        );

        IERC20(position.collateralToken).safeIncreaseAllowance(
            swapParams.dexAggregator,
            collateralNeededForDebt
        );

        uint256 debtTokenReceived = IDEXAggregator(swapParams.dexAggregator).swap(
            position.collateralToken,
            position.debtToken,
            collateralNeededForDebt,
            swapParams.minAmountOut,
            address(this)
        );

        require(debtTokenReceived >= debtRepaid, "Insufficient swap output");

        collateralWithdrawn = collateralToUse - collateralNeededForDebt;

        position.collateralAmount -= collateralToUse;
        position.debtAmount -= debtRepaid;
        position.lastUpdated = block.timestamp;

        if (position.debtAmount > 0) {
            uint256 newHealthFactor = calculateHealthFactor(
                position.collateralAmount,
                position.debtAmount,
                position.collateralToken,
                position.debtToken
            );
            position.healthFactor = newHealthFactor;
        } else {
            position.status = PositionStatus.Closed;
            position.healthFactor = type(uint256).max;
        }

        if (collateralWithdrawn > 0) {
            IERC20(position.collateralToken).safeTransfer(msg.sender, collateralWithdrawn);
        }

        emit PartialClose(
            positionId,
            percentage,
            collateralWithdrawn,
            debtRepaid
        );

        return (collateralWithdrawn, debtRepaid);
    }

    /**
     * @inheritdoc ICDPShield
     */
    function fullClose(
        uint256 positionId,
        SwapParams calldata swapParams
    )
        external
        override
        nonReentrant
        whenNotPaused
        positionExists(positionId)
        onlyPositionOwner(positionId)
        positionActive(positionId)
        returns (uint256 collateralReturned)
    {
        Position storage position = _positions[positionId];

        _validateSwapParams(swapParams, position.collateralToken, position.debtToken);

        uint256 collateralNeededForDebt = _calculateCollateralNeeded(
            position.debtAmount,
            position.collateralToken,
            position.debtToken
        );

        require(collateralNeededForDebt <= position.collateralAmount, "Insufficient collateral");

        IERC20(position.collateralToken).safeTransferFrom(
            msg.sender,
            address(this),
            collateralNeededForDebt
        );

        IERC20(position.collateralToken).safeIncreaseAllowance(
            swapParams.dexAggregator,
            collateralNeededForDebt
        );

        uint256 debtTokenReceived = IDEXAggregator(swapParams.dexAggregator).swap(
            position.collateralToken,
            position.debtToken,
            collateralNeededForDebt,
            swapParams.minAmountOut,
            address(this)
        );

        require(debtTokenReceived >= position.debtAmount, "Insufficient swap output");

        collateralReturned = position.collateralAmount - collateralNeededForDebt;

        position.collateralAmount = 0;
        position.debtAmount = 0;
        position.status = PositionStatus.Closed;
        position.healthFactor = type(uint256).max;
        position.lastUpdated = block.timestamp;

        if (collateralReturned > 0) {
            IERC20(position.collateralToken).safeTransfer(msg.sender, collateralReturned);
        }

        emit FullClose(
            positionId,
            collateralReturned,
            debtTokenReceived
        );

        return collateralReturned;
    }

    /**
     * @inheritdoc ICDPShield
     */
    function emergencyClose(
        uint256 positionId,
        SwapParams calldata swapParams
    )
        external
        override
        nonReentrant
        positionExists(positionId)
        onlyPositionOwner(positionId)
        positionActive(positionId)
        returns (bool success)
    {
        Position storage position = _positions[positionId];

        require(
            position.healthFactor <= LIQUIDATION_THRESHOLD,
            "Health factor not critical"
        );

        _validateSwapParams(swapParams, position.collateralToken, position.debtToken);

        uint256 collateralToSwap = position.collateralAmount;

        IERC20(position.collateralToken).safeTransferFrom(
            msg.sender,
            address(this),
            collateralToSwap
        );

        IERC20(position.collateralToken).safeIncreaseAllowance(
            swapParams.dexAggregator,
            collateralToSwap
        );

        uint256 debtTokenReceived = IDEXAggregator(swapParams.dexAggregator).swap(
            position.collateralToken,
            position.debtToken,
            collateralToSwap,
            swapParams.minAmountOut,
            address(this)
        );

        uint256 debtRepaid = debtTokenReceived > position.debtAmount
            ? position.debtAmount
            : debtTokenReceived;

        position.collateralAmount = 0;
        position.debtAmount -= debtRepaid;
        position.status = PositionStatus.Closed;
        position.healthFactor = 0;
        position.lastUpdated = block.timestamp;

        if (debtTokenReceived > position.debtAmount) {
            uint256 excess = debtTokenReceived - position.debtAmount;
            IERC20(position.debtToken).safeTransfer(msg.sender, excess);
        }

        emit EmergencyClose(positionId, block.timestamp);

        return true;
    }

    /**
     * @inheritdoc ICDPShield
     */
    function updatePosition(
        uint256 positionId,
        uint256 newCollateralAmount,
        uint256 newDebtAmount
    )
        external
        override
        whenNotPaused
        positionExists(positionId)
        onlyPositionOwner(positionId)
        positionActive(positionId)
    {
        require(newCollateralAmount > 0, "Invalid collateral amount");
        require(newDebtAmount > 0, "Invalid debt amount");

        Position storage position = _positions[positionId];

        position.collateralAmount = newCollateralAmount;
        position.debtAmount = newDebtAmount;
        position.lastUpdated = block.timestamp;

        uint256 newHealthFactor = calculateHealthFactor(
            newCollateralAmount,
            newDebtAmount,
            position.collateralToken,
            position.debtToken
        );

        position.healthFactor = newHealthFactor;

        emit PositionUpdated(positionId, newHealthFactor);
    }

    /**
     * @inheritdoc ICDPShield
     */
    function getPosition(uint256 positionId)
        external
        view
        override
        returns (Position memory)
    {
        return _positions[positionId];
    }

    /**
     * @inheritdoc ICDPShield
     */
    function getUserPositions(address user)
        external
        view
        override
        returns (uint256[] memory)
    {
        return _userPositions[user];
    }

    /**
     * @inheritdoc ICDPShield
     */
    function calculateHealthFactor(
        uint256 collateralAmount,
        uint256 debtAmount,
        address collateralToken,
        address debtToken
    ) public view override returns (uint256) {
        if (debtAmount == 0) {
            return type(uint256).max;
        }

        uint256 collateralPrice = priceOracle.getPrice(collateralToken);
        uint256 debtPrice = priceOracle.getPrice(debtToken);

        uint256 collateralValue = (collateralAmount * collateralPrice) / 1e18;
        uint256 debtValue = (debtAmount * debtPrice) / 1e18;

        return (collateralValue * HEALTH_FACTOR_PRECISION) / debtValue;
    }

    /**
     * @inheritdoc ICDPShield
     */
    function getPositionCount() external view override returns (uint256) {
        return _positionIdCounter;
    }

    /**
     * @inheritdoc ICDPShield
     */
    function isPaused() external view override returns (bool) {
        return paused();
    }

    /**
     * @notice Calculate collateral amount needed to repay debt
     * @param debtAmount Amount of debt to repay
     * @param collateralToken Collateral token address
     * @param debtToken Debt token address
     * @return Amount of collateral needed
     */
    function _calculateCollateralNeeded(
        uint256 debtAmount,
        address collateralToken,
        address debtToken
    ) internal view returns (uint256) {
        uint256 collateralPrice = priceOracle.getPrice(collateralToken);
        uint256 debtPrice = priceOracle.getPrice(debtToken);

        uint256 debtValue = (debtAmount * debtPrice) / 1e18;

        uint256 collateralNeeded = (debtValue * 1e18) / collateralPrice;

        return (collateralNeeded * 10050) / 10000;
    }

    /**
     * @notice Validate swap parameters
     * @param swapParams Swap parameters to validate
     * @param collateralToken Expected collateral token
     * @param debtToken Expected debt token
     */
    function _validateSwapParams(
        SwapParams calldata swapParams,
        address collateralToken,
        address debtToken
    ) internal pure {
        require(swapParams.dexAggregator != address(0), "Invalid DEX aggregator");
        require(swapParams.tokenIn == collateralToken, "Invalid token in");
        require(swapParams.tokenOut == debtToken, "Invalid token out");
        require(swapParams.amountIn > 0, "Invalid amount in");
        require(swapParams.minAmountOut > 0, "Invalid min amount out");
    }

    /**
     * @notice Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Update price oracle address (owner only)
     * @param newPriceOracle New price oracle address
     */
    function setPriceOracle(address newPriceOracle) external onlyOwner {
        require(newPriceOracle != address(0), "Invalid address");
        priceOracle = IPriceOracle(newPriceOracle);
    }

    /**
     * @notice Update DEX aggregator address (owner only)
     * @param newDexAggregator New DEX aggregator address
     */
    function setDexAggregator(address newDexAggregator) external onlyOwner {
        require(newDexAggregator != address(0), "Invalid address");
        dexAggregator = IDEXAggregator(newDexAggregator);
    }

    /**
     * @notice Emergency withdraw tokens (owner only)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @notice Set Aave Pool address (owner only)
     * @param _aavePool Aave V3 Pool address
     */
    function setAavePool(address _aavePool) external onlyOwner {
        require(_aavePool != address(0), "Invalid address");
        aavePool = _aavePool;
    }

    /**
     * @notice Set Flash Loan Receiver address (owner only)
     * @param _flashLoanReceiver Flash loan receiver contract address
     */
    function setFlashLoanReceiver(address _flashLoanReceiver) external onlyOwner {
        require(_flashLoanReceiver != address(0), "Invalid address");
        flashLoanReceiver = _flashLoanReceiver;
    }

    /**
     * @notice Reduce leverage using flash loan
     * @dev Uses Aave V3 flash loan to reduce position leverage without upfront capital
     * @param positionId Position ID to reduce leverage
     * @param debtToRepay Amount of debt to repay
     * @param minAmountOut Minimum amount of debt tokens expected from swap
     * @return newHealthFactor The new health factor after operation
     */
    function flashLoanReduceLeverage(
        uint256 positionId,
        uint256 debtToRepay,
        uint256 minAmountOut
    )
        external
        nonReentrant
        whenNotPaused
        positionExists(positionId)
        onlyPositionOwner(positionId)
        positionActive(positionId)
        returns (uint256 newHealthFactor)
    {
        require(aavePool != address(0), "Aave Pool not set");
        require(flashLoanReceiver != address(0), "Flash loan receiver not set");
        require(debtToRepay > 0, "Invalid debt amount");

        Position storage position = _positions[positionId];
        require(debtToRepay <= position.debtAmount, "Exceeds debt amount");

        // Calculate collateral needed for swap
        uint256 collateralNeeded = _calculateCollateralNeeded(
            debtToRepay,
            position.collateralToken,
            position.debtToken
        );
        require(collateralNeeded <= position.collateralAmount, "Insufficient collateral");

        // Encode flash loan parameters
        bytes memory params = abi.encode(
            uint8(0), // OperationType.REDUCE_LEVERAGE
            positionId,
            position.collateralToken,
            position.debtToken,
            collateralNeeded,
            debtToRepay,
            minAmountOut,
            msg.sender
        );

        // Approve flash loan receiver to pull collateral
        IERC20(position.collateralToken).safeTransferFrom(
            msg.sender,
            flashLoanReceiver,
            collateralNeeded
        );

        // Execute flash loan
        IAavePool(aavePool).flashLoanSimple(
            flashLoanReceiver,
            position.debtToken,
            debtToRepay,
            params,
            0 // referral code
        );

        // Update position after successful flash loan
        position.collateralAmount -= collateralNeeded;
        position.debtAmount -= debtToRepay;
        position.lastUpdated = block.timestamp;

        newHealthFactor = calculateHealthFactor(
            position.collateralAmount,
            position.debtAmount,
            position.collateralToken,
            position.debtToken
        );
        position.healthFactor = newHealthFactor;

        emit LeverageReduced(positionId, debtToRepay, collateralNeeded, newHealthFactor);

        return newHealthFactor;
    }

    /**
     * @notice Emergency close position using flash loan
     * @dev Uses Aave V3 flash loan to close position in critical health factor situations
     * @param positionId Position ID to close
     * @param minAmountOut Minimum amount of debt tokens expected from swap
     * @return success Whether the operation was successful
     */
    function flashLoanEmergencyClose(
        uint256 positionId,
        uint256 minAmountOut
    )
        external
        nonReentrant
        positionExists(positionId)
        onlyPositionOwner(positionId)
        positionActive(positionId)
        returns (bool success)
    {
        require(aavePool != address(0), "Aave Pool not set");
        require(flashLoanReceiver != address(0), "Flash loan receiver not set");

        Position storage position = _positions[positionId];

        require(
            position.healthFactor <= LIQUIDATION_THRESHOLD,
            "Health factor not critical"
        );

        // Encode flash loan parameters
        bytes memory params = abi.encode(
            uint8(1), // OperationType.EMERGENCY_CLOSE
            positionId,
            position.collateralToken,
            position.debtToken,
            position.collateralAmount,
            position.debtAmount,
            minAmountOut,
            msg.sender
        );

        // Transfer all collateral to flash loan receiver
        IERC20(position.collateralToken).safeTransferFrom(
            msg.sender,
            flashLoanReceiver,
            position.collateralAmount
        );

        // Execute flash loan for full debt amount
        IAavePool(aavePool).flashLoanSimple(
            flashLoanReceiver,
            position.debtToken,
            position.debtAmount,
            params,
            0 // referral code
        );

        // Update position as closed
        position.collateralAmount = 0;
        position.debtAmount = 0;
        position.status = PositionStatus.Closed;
        position.healthFactor = 0;
        position.lastUpdated = block.timestamp;

        emit EmergencyClose(positionId, block.timestamp);

        return true;
    }
}
