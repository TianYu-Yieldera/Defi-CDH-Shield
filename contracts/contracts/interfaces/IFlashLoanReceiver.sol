// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IFlashLoanReceiver
 * @notice Interface for flash loan callback receiver
 * @dev Implements callback functions for Balancer and Aave flash loans
 */
interface IFlashLoanReceiver {
    /**
     * @notice Balancer flash loan callback
     * @param tokens Array of tokens received
     * @param amounts Array of amounts received
     * @param feeAmounts Array of fee amounts to pay
     * @param userData Encoded user data
     */
    function receiveFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external;
}

/**
 * @title IBalancerVault
 * @notice Interface for Balancer Vault (flash loan provider)
 */
interface IBalancerVault {
    function flashLoan(
        address recipient,
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;
}

/**
 * @title IAavePool
 * @notice Interface for Aave Pool (flash loan provider)
 */
interface IAavePool {
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
}
