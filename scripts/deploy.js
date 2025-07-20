const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SkyCoin to BSC...");

  // Get deployment parameters
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

  // Deployment addresses (update these before deployment)
  const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS || deployer.address;
  const INITIAL_OWNER = process.env.INITIAL_OWNER || deployer.address;

  console.log("Recipient address:", RECIPIENT_ADDRESS);
  console.log("Initial owner:", INITIAL_OWNER);

  // Deploy the contract
  const SkyCoin = await ethers.getContractFactory("SkyCoin");
  const skyCoin = await SkyCoin.deploy(RECIPIENT_ADDRESS, INITIAL_OWNER);

  await skyCoin.waitForDeployment();
  const contractAddress = await skyCoin.getAddress();

  console.log("SkyCoin deployed to:", contractAddress);
  console.log("Transaction hash:", skyCoin.deploymentTransaction().hash);

  // Display contract details
  console.log("\n=== Contract Details ===");
  console.log("Name:", await skyCoin.name());
  console.log("Symbol:", await skyCoin.symbol());
  console.log("Total Supply:", ethers.formatEther(await skyCoin.totalSupply()));
  console.log("Owner:", await skyCoin.owner());

  // Verify contract on BSCScan (if API key is provided)
  if (process.env.BSCSCAN_API_KEY) {
    console.log("\nVerifying contract on BSCScan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [RECIPIENT_ADDRESS, INITIAL_OWNER],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\n=== Post-Deployment Checklist ===");
  console.log("1. Verify contract on BSCScan");
  console.log("2. Add liquidity to DEX");
  console.log("3. Transfer ownership if needed");
  console.log("4. Update website with contract address");
  console.log("5. Announce deployment to community");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
