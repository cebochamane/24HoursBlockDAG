const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 1) Find latest deployment json
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) throw new Error("deployments/ not found");
  const files = fs
    .readdirSync(deploymentsDir)
    .filter((f) => f.startsWith("deployment-") && f.endsWith(".json"))
    .sort();
  if (!files.length) throw new Error("No deployment JSON found");
  const latest = files[files.length - 1];
  const deployInfo = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latest), "utf8")
  );

  const address = deployInfo.contract;
  if (!address) throw new Error("No contract address in deployment JSON");

  // 2) Optionally set AI bot to a secondary signer (best-effort)
  try {
    const [owner, ai] = await ethers.getSigners();
    const arena = await ethers.getContractAt("PredictionArena", address);
    const tx = await arena.connect(owner).setAIBot(ai.address);
    await tx.wait();
    console.log(`AIBot set to ${ai.address}`);

    // Write ai bot address to shared artifacts dir if present
    const outVol = "/artifacts";
    try {
      if (fs.existsSync(outVol)) {
        fs.writeFileSync(path.join(outVol, "ai_bot_address"), ai.address);
        // For local Hardhat network, also export the known private key for signer[1]
        // so the backend can auto-load it (DEV ONLY!).
        try {
          // Default Hardhat account #1 (address matches logs)
          const known = {
            "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
          };
          const key = known[ai.address.toLowerCase()];
          if (key) {
            fs.writeFileSync(path.join(outVol, "ai_bot_private_key"), key);
          }
        } catch (e) {
          console.warn("Could not write ai_bot_private_key:", e.message);
        }
      }
    } catch (e) {
      console.warn("Could not write ai_bot_address to /artifacts:", e.message);
    }
  } catch (e) {
    console.warn("Skipping setAIBot (non-fatal):", e.message);
  }

  // 3) Export contract address and copy compiled artifacts into shared volume if available
  const artifactsDir = path.join(__dirname, "..", "artifacts");
  const outVol = "/artifacts";

  try {
    if (fs.existsSync(outVol)) {
      fs.writeFileSync(path.join(outVol, "contract_address"), address);
      // copy artifacts tree
      const dest = path.join(outVol, "artifacts");
      copyDirRecursive(artifactsDir, dest);
      console.log("Artifacts exported to /artifacts");
    } else {
      console.log("/artifacts volume not mounted; skipping export");
    }
  } catch (e) {
    console.warn("Failed exporting artifacts:", e.message);
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
