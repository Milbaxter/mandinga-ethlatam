// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @dev A simple ERC20 token for testing purposes
 */
contract MockUSDT is ERC20 {
    uint8 private constant _decimals = 6; // USDT uses 6 decimals

    constructor() ERC20("Mock USDT", "mUSDT") {
        // Mint 1,000,000 USDT to the deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** _decimals);
    }

    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens to a specific address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

