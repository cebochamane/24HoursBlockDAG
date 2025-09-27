from fastapi import APIRouter, HTTPException
from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    PriceOut,
    LeaderboardOut,
)
from app.services import price, ml, gemini, blockchain, leaderboard
from config import get_settings

settings = get_settings()

router = APIRouter()

@router.get("/price", response_model=PriceOut)
async def get_price():
    try:
        return await price.get_eth_price()
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest):
    try:
        market = await price.get_eth_price()
        ai_pred = await ml.predict_future_price(days_ahead=7)
        reasoning = await gemini.analyze_market_sentiment(market, ai_pred)
        tx_hash = blockchain.store_prediction(
            req.user_address, req.prediction_value, ai_pred
        )
        return PredictionResponse(
            user_prediction=req.prediction_value,
            ai_prediction=ai_pred,
            ai_reasoning=reasoning,
            transaction_hash=tx_hash,
            market_data=market,
            timestamp=market["timestamp"],
        )
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/leaderboard", response_model=LeaderboardOut)
async def get_leaderboard():
    try:
        return await leaderboard.get_leaderboard()
    except Exception as e:
        raise HTTPException(500, str(e))


# Optional user registration endpoints (feature-flagged)
if settings.enable_user_registration:
    from app.schemas import UserCreate, UserOut  # local import to avoid unused when disabled
    from app.db.session import SessionLocal
    from app.db.models import User

    @router.post("/users/register", response_model=UserOut)
    async def register_user(payload: UserCreate):
        try:
            with SessionLocal() as db:
                existing = (
                    db.query(User)
                    .filter(User.user_address == payload.user_address)
                    .one_or_none()
                )
                if existing:
                    # update nickname if provided
                    if payload.nickname is not None and payload.nickname != existing.nickname:
                        existing.nickname = payload.nickname
                        db.commit()
                        db.refresh(existing)
                    user = existing
                else:
                    user = User(user_address=payload.user_address, nickname=payload.nickname)
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                return UserOut(
                    id=user.id,
                    user_address=user.user_address,
                    nickname=user.nickname,
                    created_at=user.created_at,
                )
        except Exception as e:
            raise HTTPException(500, str(e))

    @router.get("/users/{user_address}", response_model=UserOut)
    async def get_user(user_address: str):
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.user_address == user_address).one_or_none()
                if not user:
                    raise HTTPException(404, "User not found")
                return UserOut(
                    id=user.id,
                    user_address=user.user_address,
                    nickname=user.nickname,
                    created_at=user.created_at,
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(500, str(e))

# Alias expected by main.py
api_router = router
