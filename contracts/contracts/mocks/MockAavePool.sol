// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockAavePool
 * @notice Mock implementation of Aave V3 Pool for testing flash loans
 * @dev Simulates flashLoanSimple functionality
 */
contract MockAavePool {
    using SafeERC20 for IERC20;

    /// @notice Flash loan premium in basis points (0.05% = 5 bps)
    uint256 public constant FLASH_LOAN_PREMIUM = 5;
    uint256 public constant PREMIUM_BASE = 10000;

    /// @notice Flash loan receiver interface selector
    bytes4 private constant EXECUTE_OPERATION_SELECTOR =
        bytes4(keccak256("executeOperation(address,uint256,uint256,address,bytes)"));

    /// @notice Emitted when a flash loan is executed
    event FlashLoan(
        address indexed receiver,
        address indexed asset,
        uint256 amount,
        uint256 premium
    );

    /**
     * @notice Execute a simple flash loan
     * @param receiverAddress The address of the contract receiving the flash loan
     * @param asset The address of the asset being flash-borrowed
     * @param amount The amount being flash-borrowed
     * @param params Arbitrary data passed to the receiver
     * @param referralCode Referral code (unused in mock)
     */
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external {
        referralCode; // Silence unused variable warning

        require(receiverAddress != address(0), "Invalid receiver");
        require(asset != address(0), "Invalid asset");
        require(amount > 0, "Invalid amount");

        // Calculate premium
        uint256 premium = (amount * FLASH_LOAN_PREMIUM) / PREMIUM_BASE;

        // Check pool has enough liquidity
        uint256 poolBalance = IERC20(asset).balanceOf(address(this));
        require(poolBalance >= amount, "Insufficient liquidity");

        // Transfer flash loan amount to receiver
        IERC20(asset).safeTransfer(receiverAddress, amount);

        // Call receiver's executeOperation
        (bool success, bytes memory result) = receiverAddress.call(
            abi.encodeWithSelector(
                EXECUTE_OPERATION_SELECTOR,
                asset,
                amount,
                premium,
                msg.sender, // initiator
                params
            )
        );

        // Check call was successful
        require(success, "Flash loan callback failed");

        // Decode return value
        bool operationSuccess = abi.decode(result, (bool));
        require(operationSuccess, "Flash loan operation failed");

        // Verify repayment (principal + premium)
        uint256 newBalance = IERC20(asset).balanceOf(address(this));
        require(newBalance >= poolBalance + premium, "Flash loan not repaid");

        emit FlashLoan(receiverAddress, asset, amount, premium);
    }

    /**
     * @notice Deposit tokens to provide liquidity
     * @param asset Token address
     * @param amount Amount to deposit
     */
    function deposit(address asset, uint256 amount) external {
        require(asset != address(0), "Invalid asset");
        require(amount > 0, "Invalid amount");
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Withdraw tokens (for testing)
     * @param asset Token address
     * @param amount Amount to withdraw
     */
    function withdraw(address asset, uint256 amount) external {
        require(asset != address(0), "Invalid asset");
        require(amount > 0, "Invalid amount");
        IERC20(asset).safeTransfer(msg.sender, amount);
    }

    /**
     * @notice Get pool balance of an asset
     * @param asset Token address
     * @return Balance of the asset in the pool
     */
    function getBalance(address asset) external view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
    }
}
