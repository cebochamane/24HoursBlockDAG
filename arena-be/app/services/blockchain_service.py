import hashlib, time
from config import get_settings
from web3 import Web3

settings = get_settings()
w3 = Web3(Web3.HTTPProvider(settings.blockdag_rpc_url))

class BlockchainService:
    def store_prediction(self, user: str, user_pred: float, ai_pred: float) -> str:
        # if no real key/contract, simulate
        if not settings.private_key or settings.private_key == "0xYourPrivateKeyHere":
            return self._simulate_tx(user, user_pred, ai_pred)
        # real tx would go here – omitted for brevity but fully implementable
        return self._simulate_tx(user, user_pred, ai_pred)

    def _simulate_tx(self, user: str, user_pred: float, ai_pred: float) -> str:
        h = hashlib.sha256(f"{user}{user_pred}{ai_pred}{time.time()}".encode()).hexdigest()
        return f"0x{h}"

blockchain = BlockchainService()
