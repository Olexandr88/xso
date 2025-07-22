# SkyCoin Security Deployment Guide

## 🔒 Secure Deployment Strategy: Temporary Account → Ledger Transfer

### Why This Approach is Best Practice

✅ **Security Benefits:**
- Hardware wallet keeps private keys offline and secure
- Separation of deployment wallet vs operational wallet
- Clear audit trail of ownership transfer
- Protection against key compromise

✅ **Operational Benefits:**
- Deploy from any convenient wallet
- Operate from secure hardware wallet
- Multi-signature capability with Ledger
- Team access control

## 📋 Pre-Deployment Checklist

### 1. Hardware Wallet Setup
- [ ] Ledger device properly initialized
- [ ] Recovery phrase backed up securely
- [ ] Ledger Live app installed and updated
- [ ] BSC network added to Ledger Live
- [ ] Test small transactions with Ledger first

### 2. Wallet Preparation
- [ ] Deployment wallet has sufficient BNB for gas
- [ ] Ledger address confirmed and tested
- [ ] All addresses double-checked

### 3. Environment Configuration
```bash
# Copy and configure environment
cp .env .env
# Edit .env with your actual values
```

Required variables:
- `PRIVATE_KEY` - Deployment wallet private key
- `LEDGER_ADDRESS` - Your Ledger hardware wallet address
- `RECIPIENT_ADDRESS` - Address to receive initial tokens
- `BSCSCAN_API_KEY` - For contract verification

## 🚀 Deployment Process

### Step 1: Test on BSC Testnet
```bash
# Deploy to testnet first
npm run deploy:secure:testnet
```

### Step 2: Deploy to Mainnet
```bash
# Deploy to BSC mainnet with automatic ownership transfer
npm run deploy:secure
```

## 🔄 Ownership Transfer Details

The deployment script automatically:

1. **Deploys contract** with temporary owner (deployment wallet)
2. **Transfers ownership** to your Ledger address
3. **Adds Ledger to exemptions** for limit bypassing
4. **Verifies contract** on BSCScan
5. **Provides post-deployment checklist**

## 🛡️ Security Considerations

### ✅ What This Protects Against:
- Private key theft from hot wallets
- Unauthorized admin function calls
- Social engineering attacks
- Single point of failure

### ⚠️ Important Reminders:
- Test all functions on testnet first
- Keep Ledger firmware updated
- Never share recovery phrases
- Use strong PIN on Ledger device
- Consider multi-signature for extra security

## 🔧 Manual Ownership Transfer (If Needed)

If automatic transfer fails, you can transfer manually:

```solidity
// Connect with deployment wallet and call:
skyCoin.transferOwnership(LEDGER_ADDRESS);
```

## 📱 Managing Contract with Ledger

### Connecting to DApps:
1. Use MetaMask connected to Ledger
2. Or use Ledger Live DApp browser
3. Or use hardware wallet with Web3 providers

### Common Admin Functions:
- Pause/unpause trading
- Update transaction limits
- Blacklist addresses
- Set exemptions
- Emergency functions

## 🚨 Emergency Procedures

### If Ledger is Lost/Damaged:
1. Use recovery phrase on new device
2. Restore wallet with same addresses
3. Verify control of contract ownership

### If Compromise Suspected:
1. Immediately pause contract (`pause()`)
2. Investigate the issue
3. Use blacklist if needed
4. Consider emergency limit removal if required

## 🔍 Post-Deployment Verification

### Verify Ownership Transfer:
```javascript
// Check current owner
await skyCoin.owner(); // Should return Ledger address
```

### Test Admin Functions:
```javascript
// Test with Ledger connected
await skyCoin.pause();    // Should work
await skyCoin.unpause();  // Should work
```

## 📊 Recommended Next Steps

1. **Test thoroughly** on testnet
2. **Add liquidity** to DEX
3. **Set up monitoring** for contract events
4. **Document** admin procedures for team
5. **Consider multi-sig** for high-value operations
6. **Plan** for audit findings implementation

## ⚡ Quick Commands

```bash
# Test deployment
npm run deploy:secure:testnet

# Production deployment
npm run deploy:secure

# Verify contract
npm run verify

# Run tests
npm test
```

---

**Remember: Security is a process, not a destination. Regularly review and update your security practices.**
