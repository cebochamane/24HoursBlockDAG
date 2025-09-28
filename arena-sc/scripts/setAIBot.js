const { ethers } = require("hardhat");

(async () => {
  const [owner] = await ethers.getSigners();
  const contractAddr = process.argv[2];
  const botAddr = process.argv[3];

  if (!contractAddr || !botAddr) {
    console.error("Usage: node scripts/setAIBot.js <contract> <botAddress>");
    process.exit(1);
  }

  const c = await ethers.getContractAt("PredictionArena", contractAddr, owner);
  const tx = await c.setAIBot(botAddr);
  console.log("setAIBot tx:", tx.hash);
  await tx.wait();
  console.log("AI bot set to:", await c.aiBot());
})();
