const fs = require("fs");
const path = require("path");

const artifact = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "PredictionArena.sol",
  "PredictionArena.json"
);

if (!fs.existsSync(artifact)) {
  console.error("Artifact not found. Run: npx hardhat compile");
  process.exit(1);
}

const { abi } = JSON.parse(fs.readFileSync(artifact, "utf8"));
const feDir = path.join(__dirname, "..", "..", "arena-fe", "src", "abi");
fs.mkdirSync(feDir, { recursive: true });
fs.writeFileSync(path.join(feDir, "PredictionArena.json"), JSON.stringify({ abi }, null, 2));
console.log("ABI exported to arena-fe/src/abi/PredictionArena.json");
