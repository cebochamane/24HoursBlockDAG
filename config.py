from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    blockdag_rpc_url: str = "https://rpc.blockdag.network"
    contract_address: str = "0x0000000000000000000000000000000000000000"
    private_key: str = ""
    # Optional chain id for signing transactions (e.g., 31337 for Anvil/Hardhat)
    chain_id: int | None = None
    model_path: str = "./app/ml/models/"
    cache_ttl: int = 300
    allowed_origins: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://localhost:80,"
        "http://frontend:80"
    )  # comma-separated (single string composed by literal concatenation)

    # Database
    database_url: str = "postgresql+psycopg2://app:app@postgres:5432/prediction"

    # Rate limiting
    rate_limit_rpm: int = 120

    # Feature flags
    enable_user_registration: bool = False

    # Pydantic v2 configuration
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        # ignore unknown env vars like POSTGRES_USER set for Docker
        "extra": "ignore",
        # silence warning about field name starting with model_
        "protected_namespaces": (),
    }

@lru_cache
def get_settings() -> Settings:
    return Settings()
