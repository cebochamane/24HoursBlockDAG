import { ethers } from 'ethers';
import { apiClient } from './api';

class Web3Service {
  constructor() {
    this.rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.guestAddress = null;
  }

  async ensureProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    }
    return this.provider;
  }

  async connectWallet() {
    if (!window.ethereum) {
      // Guest mode: create or reuse a demo address for recording bets (no signing)
      const key = 'guest_address_v1';
      let addr = localStorage.getItem(key);
      if (!addr) {
        // Use ethers to generate a random wallet locally (do NOT persist private key)
        const wallet = ethers.Wallet.createRandom();
        addr = wallet.address;
        localStorage.setItem(key, addr);
      }
      this.guestAddress = addr;
      await this.ensureProvider();
      this.signer = null; // no signing in guest mode
      return addr;
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    await this.ensureProvider();
    this.signer = await this.provider.getSigner();
    return this.signer.getAddress();
  }

  async loadABI() {
    try {
      const abi = await apiClient.getContractAbi();
      return abi;
    } catch (e) {
      // fallback to local (if provided later)
      return [];
    }
  }

  async getContract(useSigner = true) {
    if (!this.provider) await this.ensureProvider();
    if (!this.contractAddress) {
      try {
        const info = await apiClient.getChainInfo();
        this.contractAddress = info.address || this.contractAddress;
      } catch (e) {
        // ignore
      }
    }
    const abi = await this.loadABI();
    const runner = useSigner && this.signer ? this.signer : this.provider;
    this.contract = new ethers.Contract(this.contractAddress, abi, runner);
    return this.contract;
  }

  async submitPrediction(predictionValue) {
    if (!this.signer) {
      // No signer available (guest mode). Skip on-chain user tx.
      return "";
    }
    const contract = await this.getContract(true);
    const scaled = Math.round(Number(predictionValue) * 100);
    const tx = await contract.submitPrediction(scaled);
    const receipt = await tx.wait();
    return receipt.hash || receipt.transactionHash;
  }
}

export const web3Service = new Web3Service();
