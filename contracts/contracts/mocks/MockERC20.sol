// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing
 * @dev Allows anyone to mint tokens for testing purposes
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;

    // Daily mint limit per address (for testnet faucet functionality)
    uint256 public dailyMintLimit;
    mapping(address => uint256) public lastMintTime;
    mapping(address => uint256) public dailyMinted;

    event DailyMintLimitUpdated(uint256 newLimit);

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 dailyLimit
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        dailyMintLimit = dailyLimit;
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens to an address (owner only for large amounts)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function - anyone can mint up to daily limit
     * @dev Resets daily limit every 24 hours
     */
    function faucet() external {
        require(dailyMintLimit > 0, "Faucet disabled");

        // Reset daily counter if 24 hours have passed
        if (block.timestamp >= lastMintTime[msg.sender] + 1 days) {
            dailyMinted[msg.sender] = 0;
            lastMintTime[msg.sender] = block.timestamp;
        }

        require(
            dailyMinted[msg.sender] < dailyMintLimit,
            "Daily mint limit reached"
        );

        uint256 amount = dailyMintLimit - dailyMinted[msg.sender];
        dailyMinted[msg.sender] = dailyMintLimit;

        _mint(msg.sender, amount);
    }

    /**
     * @notice Update daily mint limit
     * @param newLimit New daily mint limit
     */
    function setDailyMintLimit(uint256 newLimit) external onlyOwner {
        dailyMintLimit = newLimit;
        emit DailyMintLimitUpdated(newLimit);
    }

    /**
     * @notice Burn tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
