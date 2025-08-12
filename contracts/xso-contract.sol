// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SkyCoin (XSO)
 * @dev Enhanced ERC20 token with pause, burn, and additional security features
 * @notice This contract implements a comprehensive cryptocurrency token with:
 * - Fixed supply cap to prevent inflation
 * - Emergency pause functionality
 * - Burn capabilities for deflationary mechanics
 * - Anti-whale protection with configurable limits
 * - Blacklist functionality for compliance
 * - Comprehensive event logging
 */
contract SkyCoin is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {

    // =============================================================
    //                           CONSTANTS
    // =============================================================

    /// @dev Maximum possible supply (1 trillion tokens)
    uint256 public constant MAX_SUPPLY = 1_000_000_000_000 * 10**18;

    /// @dev Initial supply percentage (100% of max supply)
    uint256 public constant INITIAL_SUPPLY = MAX_SUPPLY;

    // =============================================================
    //                           STORAGE
    // =============================================================

    /// @dev Maximum transaction amount (anti-whale protection)
    uint256 public maxTransactionAmount;

    /// @dev Maximum wallet balance (anti-whale protection)
    uint256 public maxWalletBalance;

    /// @dev Mapping of blacklisted addresses
    mapping(address => bool) public blacklisted;

    /// @dev Mapping of addresses exempt from limits
    mapping(address => bool) public exemptFromLimits;

    /// @dev Whether anti-whale protection is enabled
    bool public limitsEnabled = true;

    /// @dev DEX pair address for proper limit handling
    address public pairAddress;

    /// @dev Whether pair address has been set (can only be set once)
    bool private pairSet;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event AddressBlacklisted(address indexed account, bool indexed status);
    event LimitsUpdated(uint256 maxTransaction, uint256 maxWallet);
    event LimitsToggled(bool enabled);
    event ExemptionUpdated(address indexed account, bool indexed exempt);
    event PairAddressSet(address indexed pairAddress);

    // =============================================================
    //                           ERRORS
    // =============================================================

    error ZeroAddress();
    error InvalidAmount();
    error ExceedsMaxTransaction();
    error ExceedsMaxWallet();
    error BlacklistedAddress();  // Changed name to avoid conflict
    error LimitsNotEnabled();

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /**
     * @dev Constructor that mints initial supply and sets up the contract
     * @param recipient Address that will receive the initial token supply
     * @param initialOwner Address that will own the contract
     */
    constructor(address recipient, address initialOwner)
        ERC20("Sky Coin", "XSO")
        Ownable(initialOwner)
    {
        if (recipient == address(0) || initialOwner == address(0)) {
            revert ZeroAddress();
        }

        // Set initial anti-whale limits (10% of total supply)
        maxTransactionAmount = INITIAL_SUPPLY * 10 / 100; // 10% of total supply
        maxWalletBalance = INITIAL_SUPPLY * 100 / 100;    // 100% of total supply

        // Exempt owner, recipient, and contract from limits
        exemptFromLimits[initialOwner] = true;
        exemptFromLimits[recipient] = true;
        exemptFromLimits[address(this)] = true;

        // Mint initial supply
        _mint(recipient, INITIAL_SUPPLY);
    }

    // =============================================================
    //                      ADMIN FUNCTIONS
    // =============================================================

    /**
     * @dev Pauses all token transfers
     * @notice Only owner can call this function
     */
    function pause() public onlyOwner {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Unpauses all token transfers
     * @notice Only owner can call this function
     */
    function unpause() public onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Blacklist or unblacklist an address
     * @param account Address to blacklist/unblacklist
     * @param status True to blacklist, false to unblacklist
     */
    function setBlacklisted(address account, bool status) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        blacklisted[account] = status;
        emit AddressBlacklisted(account, status);
    }

    /**
     * @dev Update transaction and wallet limits
     * @param _maxTransaction New maximum transaction amount
     * @param _maxWallet New maximum wallet balance
     */
    function updateLimits(uint256 _maxTransaction, uint256 _maxWallet) external onlyOwner {
        if (_maxTransaction == 0 || _maxWallet == 0) revert InvalidAmount();
        if (_maxTransaction > totalSupply() || _maxWallet > totalSupply()) revert InvalidAmount();

        maxTransactionAmount = _maxTransaction;
        maxWalletBalance = _maxWallet;
        emit LimitsUpdated(_maxTransaction, _maxWallet);
    }

    /**
     * @dev Toggle limits on/off
     * @param enabled Whether limits should be enabled
     */
    function toggleLimits(bool enabled) external onlyOwner {
        limitsEnabled = enabled;
        emit LimitsToggled(enabled);
    }

    /**
     * @dev Set exemption status for an address
     * @param account Address to update exemption for
     * @param exempt Whether the address should be exempt from limits
     */
    function setExemptFromLimits(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        exemptFromLimits[account] = exempt;
        emit ExemptionUpdated(account, exempt);
    }

    /**
     * @dev Set the DEX pair address (can only be set once)
     * @param _pair Address of the DEX liquidity pair
     */
    function setPairAddress(address _pair) external onlyOwner {
        require(!pairSet, "Pair address already set");
        require(_pair != address(0), "Invalid pair address");
        pairAddress = _pair;
        pairSet = true;
        emit PairAddressSet(_pair);
    }

    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    /**
     * @dev Check if an address is blacklisted
     * @param account Address to check
     * @return bool Whether the address is blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return blacklisted[account];
    }

    /**
     * @dev Check if an address is exempt from limits
     * @param account Address to check
     * @return bool Whether the address is exempt
     */
    function isExemptFromLimits(address account) external view returns (bool) {
        return exemptFromLimits[account];
    }

    /**
     * @dev Get current limit settings
     * @return maxTx Maximum transaction amount
     * @return maxWallet Maximum wallet balance
     * @return enabled Whether limits are enabled
     */
    function getLimits() external view returns (uint256 maxTx, uint256 maxWallet, bool enabled) {
        return (maxTransactionAmount, maxWalletBalance, limitsEnabled);
    }

    // =============================================================
    //                      INTERNAL FUNCTIONS
    // =============================================================

    /**
     * @dev Internal function to update token balances with additional checks
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param value Amount of tokens to transfer
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        // Check blacklist status
        if (blacklisted[from] || blacklisted[to]) {
            revert BlacklistedAddress();
        }

        // Apply limits only if enabled and not a mint/burn operation
        if (limitsEnabled && from != address(0) && to != address(0)) {
            _checkLimits(from, to, value);
        }

        super._update(from, to, value);
    }

    /**
     * @dev Check transaction and wallet limits
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param value Amount of tokens to transfer
     */
    function _checkLimits(address from, address to, uint256 value) internal view {
        // Skip limits for exempt addresses
        if (exemptFromLimits[from] || exemptFromLimits[to]) {
            return;
        }

        // Check transaction limit
        if (value > maxTransactionAmount) {
            revert ExceedsMaxTransaction();
        }

        // Check wallet limit for recipient, but skip for pair address
        // This allows DEX trading while maintaining anti-whale protection for users
        if (to != pairAddress && balanceOf(to) + value > maxWalletBalance) {
            revert ExceedsMaxWallet();
        }
    }

    // =============================================================
    //                    EMERGENCY FUNCTIONS
    // =============================================================

    /**
     * @dev Emergency function to remove limits (use with caution)
     * @notice This permanently disables all limits and this action is reversible
     */
    function emergencyRemoveLimits() external onlyOwner {
        limitsEnabled = false;
        maxTransactionAmount = totalSupply();
        maxWalletBalance = totalSupply();
        emit LimitsToggled(false);
        emit LimitsUpdated(totalSupply(), totalSupply());
    }
}
