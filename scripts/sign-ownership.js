const { ethers } = require("hardhat");
require('dotenv').config();

async function signOwnershipMessage() {
  console.log("=== BSCScan Ownership Verification Signature Generator ===\n");

  // The message from BSCScan
  const message = "[BscScan.com 22/07/2025 18:16:00] I, hereby verify that I am the owner/creator of the address [0xe9E5b832ecd37dD0015d42A003CF5632105a9539]";

  // Get private key from environment
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error("❌ Error: PRIVATE_KEY not found in .env file");
    console.log("💡 Make sure your .env file contains:");
    console.log("   PRIVATE_KEY=your_private_key_here");
    return;
  }

  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);

    console.log("📍 Signing with address:", wallet.address);
    console.log("📝 Message to sign:");
    console.log(`"${message}"`);

    // Sign the message
    const signature = await wallet.signMessage(message);

    console.log("\n✅ Signature Generated Successfully!");
    console.log("🔑 Signature Hash:");
    console.log(signature);

    console.log("\n📋 For BSCScan Verification:");
    console.log("1. Copy the signature hash above");
    console.log("2. Paste it in the 'Signature Hash' field on BSCScan");
    console.log("3. Make sure the message is exactly:");
    console.log(`   "${message}"`);

    // Verify the signature (optional check)
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log("\n🔍 Verification Check:");
    console.log("   Original address:", wallet.address);
    console.log("   Recovered address:", recoveredAddress);
    console.log("   Match:", wallet.address.toLowerCase() === recoveredAddress.toLowerCase() ? "✅ YES" : "❌ NO");

  } catch (error) {
    console.error("❌ Error signing message:", error.message);
    console.log("\n💡 Common issues:");
    console.log("   - Make sure PRIVATE_KEY is valid (starts with 0x)");
    console.log("   - Check that .env file is in the correct location");
    console.log("   - Verify the private key belongs to the deployment address");
  }
}

signOwnershipMessage().catch(console.error);
