from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Literal

class PredictionRequest(BaseModel):
    user_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    prediction_value: float = Field(..., gt=0)

class PredictionResponse(BaseModel):
    user_prediction: float
    ai_prediction: float
    ai_reasoning: str
    transaction_hash: str
    market_data: dict
    timestamp: datetime

class PriceOut(BaseModel):
    asset: str
    current_price: float
    price_change_24h: float
    market_cap: float
    timestamp: datetime

class LeaderboardRow(BaseModel):
    rank: int
    user_address: str
    accuracy_score: float
    total_predictions: int
    avg_error: float

class LeaderboardOut(BaseModel):
    entries: List[LeaderboardRow]
    total_players: int
    updated_at: datetime


class UserCreate(BaseModel):
    user_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    nickname: str | None = Field(default=None, max_length=50)


class UserOut(BaseModel):
    id: int
    user_address: str
    nickname: str | None
    created_at: datetime


# Chat endpoint schemas
class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    message: str
    timestamp: datetime


# Markets
class Market(BaseModel):
    id: str
    title: str
    deadline: datetime
    status: str | None = None  # open|closed|resolved
    outcome: str | None = None # YES|NO or None


class MarketsOut(BaseModel):
    items: List[Market]


# Bets
class BetCreate(BaseModel):
    side: Literal['YES', 'NO']
    amount: float = Field(..., gt=0)
    user_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")


class BetOut(BaseModel):
    id: int
    market_id: str
    side: str
    amount: float
    user_address: str
    created_at: datetime
    status: str
    payout_amount: float


class UserBetsOut(BaseModel):
    items: List[BetOut]
