"""Service singletons exposed for convenient imports.

Allows:
    from app.services import price, ml, gemini, blockchain, leaderboard
"""

from .price_service import price  # noqa: F401
from .ml_service import ml  # noqa: F401
from .gemini_service import gemini  # noqa: F401
from .blockchain_service import blockchain  # noqa: F401
from .leaderboard_service import leaderboard  # noqa: F401

__all__ = [
    "price",
    "ml",
    "gemini",
    "blockchain",
    "leaderboard",
]
