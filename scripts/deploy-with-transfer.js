const { ethers } = require("hardhat");

async function main() {
  console.log("=== SkyCoin Deployment & Ownership Transfer Script ===\n");

  // Get deployment parameters
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

  // Configuration - UPDATE THESE BEFORE DEPLOYMENT
  const config = {
    // Address that will receive initial token supply
    RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS || deployer.address,

    // Temporary owner (deployer) - will be transferred later
    INITIAL_OWNER: deployer.address,

    // Final owner (Ledger address) - WHERE OWNERSHIP WILL BE TRANSFERRED
    FINAL_OWNER: process.env.LEDGER_ADDRESS || "0x0000000000000000000000000000000000000000",

    // Whether to transfer ownership immediately after deployment
    TRANSFER_OWNERSHIP: process.env.TRANSFER_OWNERSHIP === "true" || false
  };

  // Validate addresses
  if (config.FINAL_OWNER === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  WARNING: LEDGER_ADDRESS not set in environment variables");
    console.log("💡 Set LEDGER_ADDRESS=your_ledger_address in .env file");
    if (config.TRANSFER_OWNERSHIP) {
      console.log("❌ Cannot transfer ownership without valid Ledger address");
      process.exit(1);
    }
  }

  console.log("\n📋 Configuration:");
  console.log("   Initial token recipient:", config.RECIPIENT_ADDRESS);
  console.log("   Temporary owner (deployer):", config.INITIAL_OWNER);
  console.log("   Final owner (Ledger):", config.FINAL_OWNER);
  console.log("   Auto-transfer ownership:", config.TRANSFER_OWNERSHIP);

  // Deploy the contract
  console.log("\n🏗️  Deploying SkyCoin contract...");
  const SkyCoin = await ethers.getContractFactory("SkyCoin");
  const skyCoin = await SkyCoin.deploy(config.RECIPIENT_ADDRESS, config.INITIAL_OWNER);

  await skyCoin.waitForDeployment();
  const contractAddress = await skyCoin.getAddress();

  console.log("✅ SkyCoin deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 Transaction hash:", skyCoin.deploymentTransaction().hash);

  // Display contract details
  console.log("\n📊 Contract Details:");
  console.log("   Name:", await skyCoin.name());
  console.log("   Symbol:", await skyCoin.symbol());
  console.log("   Total Supply:", ethers.formatEther(await skyCoin.totalSupply()), "XSO");
  console.log("   Current Owner:", await skyCoin.owner());
  console.log("   Decimals:", await skyCoin.decimals());

  // Display initial limits
  const [maxTx, maxWallet, limitsEnabled] = await skyCoin.getLimits();
  console.log("\n🛡️  Security Settings:");
  console.log("   Max Transaction:", ethers.formatEther(maxTx), "XSO");
  console.log("   Max Wallet:", ethers.formatEther(maxWallet), "XSO");
  console.log("   Limits Enabled:", limitsEnabled);

  // Check exemptions
  console.log("\n🎫 Exempt Addresses:");
  console.log("   Owner exempt:", await skyCoin.isExemptFromLimits(config.INITIAL_OWNER));
  console.log("   Recipient exempt:", await skyCoin.isExemptFromLimits(config.RECIPIENT_ADDRESS));
  console.log("   Contract exempt:", await skyCoin.isExemptFromLimits(contractAddress));

  // Transfer ownership if requested and Ledger address is valid
  if (config.TRANSFER_OWNERSHIP && config.FINAL_OWNER !== "0x0000000000000000000000000000000000000000") {
    console.log("\n🔄 Transferring ownership to Ledger...");

    try {
      // First, exempt the new owner from limits BEFORE transferring ownership
      console.log("🎫 Adding Ledger address to exemptions...");
      const exemptTx = await skyCoin.setExemptFromLimits(config.FINAL_OWNER, true);
      await exemptTx.wait();
      console.log("✅ Ledger address exempted from limits");

      // Then transfer ownership
      const transferTx = await skyCoin.transferOwnership(config.FINAL_OWNER);
      await transferTx.wait();

      console.log("✅ Ownership transferred successfully!");
      console.log("🔗 Transfer transaction:", transferTx.hash);
      console.log("👑 New owner:", await skyCoin.owner());

    } catch (error) {
      console.log("❌ Ownership transfer failed:", error.message);
      console.log("💡 You can transfer ownership manually later using:");
      console.log(`   skyCoin.transferOwnership("${config.FINAL_OWNER}")`);
    }
  } else if (!config.TRANSFER_OWNERSHIP) {
    console.log("\n⏳ Ownership transfer skipped (TRANSFER_OWNERSHIP=false)");
    console.log("💡 To transfer ownership later, use:");
    console.log(`   skyCoin.transferOwnership("${config.FINAL_OWNER}")`);
  }

  // Contract verification reminder
  console.log("\n🔍 Contract Verification:");
  if (process.env.BSCSCAN_API_KEY) {
    console.log("⏳ Attempting automatic verification...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [config.RECIPIENT_ADDRESS, config.INITIAL_OWNER],
      });
      console.log("✅ Contract verified on BSCScan!");
    } catch (error) {
      console.log("⚠️  Auto-verification failed:", error.message);
      console.log("💡 Verify manually on BSCScan with these parameters:");
      console.log(`   Contract: ${contractAddress}`);
      console.log(`   Constructor args: ["${config.RECIPIENT_ADDRESS}", "${config.INITIAL_OWNER}"]`);
    }
  } else {
    console.log("💡 To verify contract, set BSCSCAN_API_KEY and run:");
    console.log(`   npx hardhat verify --network bscMainnet ${contractAddress} "${config.RECIPIENT_ADDRESS}" "${config.INITIAL_OWNER}"`);
  }

  // Post-deployment checklist
  console.log("\n✅ Post-Deployment Checklist:");
  console.log("1. ✅ Contract deployed successfully");
  console.log("2. ⏳ Verify contract on BSCScan");
  console.log("3. ⏳ Test basic functions (transfer, pause, etc.)");
  if (config.TRANSFER_OWNERSHIP) {
    console.log("4. ✅ Ownership transferred to Ledger");
  } else {
    console.log("4. ⏳ Transfer ownership to Ledger hardware wallet");
  }
  console.log("5. ⏳ Add initial liquidity to DEX");
  console.log("6. ⏳ Update website/docs with contract address");
  console.log("7. ⏳ Announce deployment to community");
  console.log("8. ⏳ Begin audit process if not done yet");

  // Security reminders
  console.log("\n🔒 Security Reminders:");
  console.log("• Keep your Ledger hardware wallet secure");
  console.log("• Backup your recovery phrase safely");
  console.log("• Test all admin functions before mainnet use");
  console.log("• Consider using a multi-signature wallet for extra security");
  console.log("• Monitor the contract for any unusual activity");

  console.log("\n🎉 Deployment completed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`👑 Current Owner: ${await skyCoin.owner()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
