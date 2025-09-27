const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const inHours = (h) => Math.floor(Date.now() / 1000) + h * 3600;

async function main() {
  // Set deadline 24h from now (tweak for demo)
  const deadline = inHours(24);

  // If your constructor is only (deadline):
  const Factory = await ethers.getContractFactory("PredictionArena");
  const contract = await Factory.deploy(deadline);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();

  console.log("==== Deployment Summary ====");
  console.log("Network:   ", network.name);
  console.log("Chain ID:  ", network.config.chainId ?? "(unknown)");
  console.log("Contract:  ", addr);
  console.log("Deadline:  ", deadline);
  console.log("============================");

  // Save deployment info for FE or records
  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const out = {
    network: network.name,
    chainId: network.config.chainId ?? null,
    contract: addr,
    deadline
  };
  fs.writeFileSync(
    path.join(outDir, `deployment-${network.name}.json`),
    JSON.stringify(out, null, 2)
  );
  console.log(`Saved: deployments/deployment-${network.name}.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
