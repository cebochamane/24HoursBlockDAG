// Load Hardhat plugins & env
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Env vars
const {
  BLOCKDAG_RPC_URL,
  BLOCKDAG_CHAIN_ID,
  PRIVATE_KEY,
  BLOCKDAG_EXPLORER_API_KEY
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // Local Hardhat node (npx hardhat node)
    localhost: { url: "http://127.0.0.1:8545" },

    // BlockDAG EVM-compatible network
    blockdag: {
      url: BLOCKDAG_RPC_URL || "",
      chainId: Number(BLOCKDAG_CHAIN_ID) || undefined,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  // Only relevant if BlockDAG exposes explorer verification API
  etherscan: {
    apiKey: {
      blockdag: BLOCKDAG_EXPLORER_API_KEY || ""
    }
  },
  mocha: { timeout: 40000 }
};
