const { ethers } = require("hardhat");

async function checkContract() {
  console.log("=== Checking Deployed SkyCoin Contract on BSC MAINNET ===\n");

  // Your deployed contract address on MAINNET
  const CONTRACT_ADDRESS = "0xe9E5b832ecd37dD0015d42A003CF5632105a9539";

  // Connect to the contract
  const SkyCoin = await ethers.getContractFactory("SkyCoin");
  const skyCoin = SkyCoin.attach(CONTRACT_ADDRESS);

  try {
    console.log("📍 Contract Address:", CONTRACT_ADDRESS);
    console.log("🌐 Network: BSC Mainnet");

    // Get basic info
    const name = await skyCoin.name();
    const symbol = await skyCoin.symbol();
    const totalSupply = await skyCoin.totalSupply();
    const owner = await skyCoin.owner();

    console.log("\n📊 Basic Info:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Total Supply:", ethers.formatEther(totalSupply), "XSO");
    console.log("   Current Owner:", owner);

    // Get limits
    const [maxTx, maxWallet, limitsEnabled] = await skyCoin.getLimits();
    console.log("\n🛡️  Current Limits:");
    console.log("   Max Transaction:", ethers.formatEther(maxTx), "XSO");
    console.log("   Max Wallet:", ethers.formatEther(maxWallet), "XSO");
    console.log("   Limits Enabled:", limitsEnabled);

    // Check exemptions for key addresses
    const deployerAddress = "0x4549425bf79A701e46e1d9345AC68b6564cFeb75";
    const ledgerAddress = "0x411224355D4fa552ebcD392a0Fba34f93483DE56";

    console.log("\n🎫 Exemption Status:");
    console.log("   Deployer exempt:", await skyCoin.isExemptFromLimits(deployerAddress));
    console.log("   Ledger exempt:", await skyCoin.isExemptFromLimits(ledgerAddress));

    // Check balances
    const deployerBalance = await skyCoin.balanceOf(deployerAddress);
    const ledgerBalance = await skyCoin.balanceOf(ledgerAddress);

    console.log("\n💰 Token Balances:");
    console.log("   Deployer Balance:", ethers.formatEther(deployerBalance), "XSO");
    console.log("   Ledger Balance:", ethers.formatEther(ledgerBalance), "XSO");

    // Critical Analysis for Transfer
    console.log("\n🔍 TRANSFER ANALYSIS:");
    const maxTxBN = BigInt(maxTx);
    const totalSupplyBN = BigInt(totalSupply);
    const deployerBalanceBN = BigInt(deployerBalance);
    const deployerExempt = await skyCoin.isExemptFromLimits(deployerAddress);

    console.log("   Deployer balance:", ethers.formatEther(deployerBalance), "XSO");
    console.log("   Max transaction limit:", ethers.formatEther(maxTx), "XSO");
    console.log("   Is deployer exempt?", deployerExempt);

    if (limitsEnabled && !deployerExempt && deployerBalanceBN > maxTxBN) {
      console.log("\n❌ CRITICAL: Full transfer will FAIL!");
      console.log("   Reason: Transfer amount exceeds max transaction limit");
      console.log("   Solutions:");
      console.log("   1. 🔧 Use Ledger to exempt deployer address first");
      console.log("   2. 📦 Transfer in smaller chunks");
      console.log("   3. 🚨 Use emergency function to remove limits");
    } else if (deployerExempt) {
      console.log("\n✅ SAFE: Full transfer will work!");
      console.log("   Reason: Deployer address is exempt from limits");
    } else if (!limitsEnabled) {
      console.log("\n✅ SAFE: Full transfer will work!");
      console.log("   Reason: Limits are disabled");
    } else {
      console.log("\n✅ SAFE: Full transfer should work!");
      console.log("   Reason: Transfer amount within limits");
    }

    // Show exact commands needed if action required
    if (limitsEnabled && !deployerExempt && deployerBalanceBN > maxTxBN) {
      console.log("\n🔧 TO FIX - Connect your Ledger and run:");
      console.log(`   skyCoin.setExemptFromLimits("${deployerAddress}", true)`);
      console.log("\n   Or split transfer into chunks of:", ethers.formatEther(maxTx), "XSO each");
    }

  } catch (error) {
    console.error("❌ Error checking contract:", error.message);
    console.log("\n💡 This might be a network connection issue or the contract address is incorrect.");
  }
}

checkContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
