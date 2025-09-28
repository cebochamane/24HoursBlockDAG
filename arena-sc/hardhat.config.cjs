require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545",
      chainId: parseInt(process.env.CHAIN_ID || "31337", 10),
      // accounts: [] // use Hardhat local accounts
    },
    blockdagTestnet: {
      url: "https://rpc-testnet.bdagscan.com",
      chainId: 24171,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
