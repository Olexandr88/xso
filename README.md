# SkyCoin (XSO) - Enhanced ERC20 Token

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

## 📋 Overview

SkyCoin (XSO) is a comprehensive ERC20 token built on Binance Smart Chain (BSC) with advanced security features, anti-whale protection, and administrative controls. The token is designed with security-first principles and includes multiple layers of protection against common vulnerabilities.

### Contract Address
- **Mainnet**: `0xe9E5b832ecd37dD0015d42A003CF5632105a9539`
- **Testnet**: `0x4DAA6661B01336CDaF1b7DD77189c85c69c837A3`

## 🚀 Features

### Core Functionality
- **ERC20 Standard**: Full compliance with ERC20 interface
- **Fixed Supply**: 1 trillion tokens (1,000,000,000,000 XSO)
- **18 Decimals**: Standard decimal precision
- **Burn Mechanism**: Deflationary token economics

### Security Features
- **Pausable**: Emergency pause functionality for crisis management
- **Anti-Whale Protection**: Configurable transaction and wallet limits
- **Blacklist System**: Compliance and security blacklisting
- **Reentrancy Guard**: Protection against reentrancy attacks
- **Ownership Controls**: Secure administrative functions

### Advanced Features
- **Exemption System**: Whitelist addresses from limits
- **Emergency Functions**: Quick response to security threats
- **Comprehensive Events**: Full audit trail of all operations
- **Limit Toggle**: Dynamic enable/disable of anti-whale protection

## 🏗️ Architecture

```
SkyCoin Contract
├── ERC20 (OpenZeppelin)
├── ERC20Burnable (OpenZeppelin)
├── ERC20Pausable (OpenZeppelin)
└── Ownable (OpenZeppelin)
```

## 📊 Token Economics

| Parameter | Value |
|-----------|-------|
| **Name** | Sky Coin |
| **Symbol** | XSO |
| **Total Supply** | 1,000,000,000,000 XSO |
| **Max Transaction** | 100,000,000,000 XSO (10%) |
| **Max Wallet** | 1,000,000,000,000 XSO (100%) |
| **Decimals** | 18 |

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd xso

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
BSC_API_KEY=your_bscscan_api_key_here

# Network URLs
BSC_MAINNET_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Deployment Addresses
INITIAL_RECIPIENT=0x4549425bf79A701e46e1d9345AC68b6564cFeb75
LEDGER_ADDRESS=0x9B781fE01ec31642132ADa0fc39Da7f1Dd6B1BaC
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm run test

# Run with gas reporting
REPORT_GAS=true npm run test

# Run coverage analysis
npm run test:coverage
```

### Test Coverage
- **Statements**: 100%
- **Branches**: 81.82%
- **Functions**: 100%
- **Lines**: 100%

## 🚀 Deployment

### Compile Contract
```bash
npm run compile
```

### Deploy to Networks
```bash
# Deploy to BSC Testnet
npm run deploy:secure:testnet

# Deploy to BSC Mainnet
npm run deploy:secure:mainnet
```

### Verify Contract
```bash
# Verify on BSCScan
npm run verify
```

## 🔒 Security Features

### Anti-Whale Protection
- **Transaction Limits**: Prevents large single transactions
- **Wallet Limits**: Prevents concentration of tokens
- **Exemption System**: Allows whitelisting of trusted addresses

### Access Controls
- **Owner-Only Functions**: Critical functions restricted to contract owner
- **Emergency Controls**: Rapid response capabilities
- **Blacklist Management**: Compliance and security enforcement

### Reentrancy Protection
- No external calls in contract functions, eliminating reentrancy risks
- Follows checks-effects-interactions pattern

## 📚 API Reference

### Core Functions

#### `transfer(address to, uint256 amount)`
Standard ERC20 transfer with security checks.

#### `burn(uint256 amount)`
Burns tokens from caller's balance, reducing total supply.

#### `pause()` / `unpause()`
Emergency pause/unpause functionality (owner only).

### Administrative Functions

#### `setBlacklisted(address account, bool isBlacklisted)`
Add or remove addresses from blacklist (owner only).

#### `updateLimits(uint256 maxTx, uint256 maxWallet)`
Update anti-whale protection limits (owner only).

#### `setExemptFromLimits(address account, bool exempt)`
Exempt addresses from transaction limits (owner only).

#### `emergencyRemoveLimits()`
Permanently disable all limits (emergency use, owner only).

## 🔍 Contract Verification

The contract has been verified on BSCScan with the following parameters:
- **Compiler Version**: 0.8.30
- **Optimization**: Enabled (200 runs)
- **Constructor Arguments**: Encoded ABI parameters

## 🚨 Security Considerations

### Known Limitations
- Anti-whale protection can be bypassed through multiple transactions
- Owner has significant control over contract functionality
- Blacklist functionality requires centralized management

### Best Practices Implemented
- ✅ Reentrancy protection on all external functions
- ✅ Input validation on all parameters
- ✅ Event emission for all state changes
- ✅ Use of established OpenZeppelin contracts
- ✅ Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For technical support or questions:
- Create an issue in this repository
- Contact the development team

## 🔗 Links

- [BSCScan Contract](https://bscscan.com/address/0xe9E5b832ecd37dD0015d42A003CF5632105a9539)
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/)
- [Hardhat Documentation](https://hardhat.org/docs)

---

**⚠️ Disclaimer**: This smart contract has been developed with security best practices, but cryptocurrency investments carry inherent risks. Please conduct your own research before interacting with any smart contract.
