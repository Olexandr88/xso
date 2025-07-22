# BSCScan Manual Contract Verification Guide

## 📋 Your Contract Details
- **Contract Address:** `0xe9E5b832ecd37dD0015d42A003CF5632105a9539`
- **Network:** BSC Mainnet
- **Contract Name:** SkyCoin

## 🔧 Step-by-Step Verification Process

### Step 1: Go to BSCScan Verification Page
1. Visit: https://bscscan.com/verifyContract
2. Enter your contract address: `0xe9E5b832ecd37dD0015d42A003CF5632105a9539`
3. Click "Continue"

### Step 2: Select Compiler Settings
Choose these exact settings to match your deployment:

**Compiler Type:** 
- ✅ Select "Solidity (Single file)"

**Compiler Version:**
- ✅ Select "v0.8.20+commit.a1b79de6" (must match exactly)

**Open Source License Type:**
- ✅ Select "MIT License (MIT)"

### Step 3: Upload Contract Source Code
1. **Copy the entire content** from the file: `flattened-contract.sol`
2. **Paste it** in the "Enter the Solidity Contract Code below" text area
3. **Contract Name:** Enter `SkyCoin` (case sensitive)

### Step 4: Constructor Arguments (CRITICAL)
You MUST enter the constructor arguments in ABI-encoded format:

**Constructor Arguments (ABI-encoded hex):**
```
0x0000000000000000000000004549425bf79a701e46e1d9345ac68b6564cfeb750000000000000000000000004549425bf79a701e46e1d9345ac68b6564cfeb75
```

**What this represents:**
- First address: `0x4549425bf79A701e46e1d9345AC68b6564cFeb75` (recipient)
- Second address: `0x4549425bf79A701e46e1d9345AC68b6564cFeb75` (initial owner)

### Step 5: Advanced Settings (Optional but Recommended)
**Optimization:**
- ✅ Enable optimization: "Yes"
- ✅ Runs: 200

**EVM Version:**
- ✅ Select "default" or "paris"

### Step 6: Submit for Verification
1. Complete the captcha
2. Click "Verify and Publish"
3. Wait for processing (usually 1-3 minutes)

## ⚠️ Common Issues & Solutions

### If Verification Fails:
1. **Double-check compiler version** - Must be exactly v0.8.20
2. **Verify constructor arguments** - Must be the exact hex string above
3. **Check optimization settings** - Enable with 200 runs
4. **Ensure complete flattened code** - Copy entire file content

### If Constructor Arguments Error:
The constructor arguments represent:
- `recipient`: The address that received initial tokens
- `initialOwner`: The address that became the contract owner

Both were set to your deployer address during deployment.

## ✅ After Successful Verification

Once verified, you'll see:
- ✅ Green checkmark on BSCScan
- 📖 "Read Contract" tab available
- 📝 "Write Contract" tab available
- 🔍 Source code visible to everyone

## 🔗 Quick Links
- **Your Contract:** https://bscscan.com/address/0xe9E5b832ecd37dD0015d42A003CF5632105a9539
- **Verification Page:** https://bscscan.com/verifyContract

## 📞 Need Help?
If verification still fails, check:
1. Compiler version matches exactly
2. Constructor arguments are correct
3. Full flattened contract code is used
4. Optimization settings match deployment
