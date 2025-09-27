const { ethers } = require("hardhat");

async function main() {
  console.log(" Deploying PredictionArena...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Set deadline to 24 hours from now
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const deadline = currentTimestamp + (24 * 60 * 60); // 24 hours in seconds
  
  console.log("Current time:", new Date(currentTimestamp * 1000).toISOString());
  console.log("Deadline:", new Date(deadline * 1000).toISOString());
  
  // Get the contract factory
  const PredictionArena = await ethers.getContractFactory("PredictionArena");
  
  // Deploy the contract
  const predictionArena = await PredictionArena.deploy(deadline);
  
  // Wait for deployment to complete
  await predictionArena.waitForDeployment();
  
  const contractAddress = await predictionArena.getAddress();
  console.log(" PredictionArena deployed to:", contractAddress);
  
  // Get contract info
  const info = await predictionArena.getInfo();
  console.log("\n Contract Information:");
  console.log("Owner:", info.ownerAddress);
  console.log("AI Bot:", info.aiBotAddress);
  console.log("Deadline:", new Date(Number(info.deadlineTimestamp) * 1000).toISOString());
  console.log("Resolved:", info.isResolved);
  console.log("Actual Value:", info.actualValueResult.toString());
  
  // Save deployment info for frontend/testing
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    deadline: new Date(deadline * 1000).toISOString(),
    network: network.name,
    chainId: network.config.chainId
  };
  
  fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n Deployment info saved to deployment-info.json");
  
  console.log("\n Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });