/* eslint-disable @typescript-eslint/no-var-requires */
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const {
  BLOCKDAG_RPC_URL,
  BLOCKDAG_CHAIN_ID,
  PRIVATE_KEY,
  BLOCKDAG_EXPLORER_API_KEY
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.20',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    blockdag: {
      url: BLOCKDAG_RPC_URL || '',
      chainId: BLOCKDAG_CHAIN_ID ? Number(BLOCKDAG_CHAIN_ID) : undefined,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      blockdag: BLOCKDAG_EXPLORER_API_KEY || ''
    }
  },
  mocha: { timeout: 60000 }
};
