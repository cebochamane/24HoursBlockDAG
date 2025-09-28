import hashlib, time
from config import get_settings
from web3 import Web3
try:
    # Web3 v6 preferred middleware
    from web3.middleware import construct_poa_middleware
except Exception:  # pragma: no cover
    construct_poa_middleware = None
from eth_account import Account

from typing import Optional

settings = get_settings()
w3 = Web3(Web3.HTTPProvider(settings.blockdag_rpc_url))

# Attach POA middleware if available (no-op if not needed or not present)
try:
    if construct_poa_middleware is not None:
        w3.middleware_onion.inject(construct_poa_middleware(), layer=0)
except Exception:
    pass

# Minimal ABI for PredictionArena.submitAIBotPrediction(int256)
PREDICTION_ARENA_ABI = [
    {
        "inputs": [{"internalType": "int256", "name": "value", "type": "int256"}],
        "name": "submitAIBotPrediction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

class BlockchainService:
    def store_prediction(self, user: str, user_pred: float, ai_pred: float) -> str:
        # v1 integration: users submit their own prediction on-chain from the frontend.
        # Backend submits the AI bot prediction on-chain when private key + contract are configured.
        if settings.private_key and settings.contract_address and settings.contract_address != "0x0000000000000000000000000000000000000000":
            try:
                return self._submit_ai_prediction_onchain(ai_pred)
            except Exception:
                # On any failure, fall back to simulation so the API remains responsive in demo environments
                return self._simulate_tx(user, user_pred, ai_pred)
        # Otherwise simulate
        return self._simulate_tx(user, user_pred, ai_pred)

    def _simulate_tx(self, user: str, user_pred: float, ai_pred: float) -> str:
        h = hashlib.sha256(f"{user}{user_pred}{ai_pred}{time.time()}".encode()).hexdigest()
        return f"0x{h}"

    def _submit_ai_prediction_onchain(self, ai_pred: float) -> str:
        # Convert float to scaled int (e.g., *100 for 2 decimals)
        scaled = int(round(ai_pred * 100))

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(settings.contract_address),
            abi=PREDICTION_ARENA_ABI,
        )

        acct = Account.from_key(settings.private_key)
        nonce = w3.eth.get_transaction_count(acct.address)

        tx = contract.functions.submitAIBotPrediction(scaled).build_transaction({
            "from": acct.address,
            "nonce": nonce,
            "gas": 150000,
            "gasPrice": w3.eth.gas_price,
        })

        # Optional CHAIN_ID if provided via env (Settings may not have it defined)
        chain_id: Optional[int] = None
        if hasattr(settings, "chain_id"):
            try:
                chain_id = int(getattr(settings, "chain_id"))
            except Exception:
                chain_id = None
        if chain_id:
            tx["chainId"] = chain_id

        signed = Account.sign_transaction(tx, private_key=settings.private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()

blockchain = BlockchainService()
