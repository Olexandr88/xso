const fs = require('fs');
const path = require('path');

async function generateStandardJsonInput() {
  console.log("=== Generating Standard-Json-Input for BSCScan Verification ===\n");

  // Read the build info file
  const buildInfoPath = path.join(__dirname, '../artifacts/build-info');
  const buildFiles = fs.readdirSync(buildInfoPath);
  const latestBuildFile = buildFiles[buildFiles.length - 1];
  const buildInfo = JSON.parse(fs.readFileSync(path.join(buildInfoPath, latestBuildFile), 'utf8'));

  // Extract the standard JSON input
  const standardJsonInput = buildInfo.input;

  // Save to file
  const outputPath = path.join(__dirname, '../standard-input.json');
  fs.writeFileSync(outputPath, JSON.stringify(standardJsonInput, null, 2));

  console.log("✅ Standard-Json-Input file created: standard-input.json");
  console.log("📁 File size:", (fs.statSync(outputPath).size / 1024).toFixed(2), "KB");

  console.log("\n🎯 BSCScan Verification Instructions:");
  console.log("1. Go to: https://bscscan.com/verifyContract");
  console.log("2. Enter contract address: 0xe9E5b832ecd37dD0015d42A003CF5632105a9539");
  console.log("3. Select: 'Solidity (Standard-Json-Input)'");
  console.log("4. Compiler version: v0.8.30");
  console.log("5. Upload the file: standard-input.json");
  console.log("6. Contract name: contracts/xso-contract.sol:SkyCoin");
  console.log("7. Constructor arguments: 0x0000000000000000000000004549425bf79a701e46e1d9345ac68b6564cfeb750000000000000000000000004549425bf79a701e46e1d9345ac68b6564cfeb75");

  console.log("\n✨ This method is much easier than manual copy-paste!");
}

generateStandardJsonInput().catch(console.error);
