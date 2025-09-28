from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
import os
from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    PriceOut,
    LeaderboardOut,
    ChatRequest,
    ChatResponse,
    MarketsOut,
    Market as MarketSchema,
    BetCreate,
    BetOut,
    UserBetsOut,
)
from app.services import price, ml, gemini, blockchain, leaderboard
from datetime import datetime
from config import get_settings
from app.db.session import SessionLocal
from app.db.models import Bet, Market as MarketModel

settings = get_settings()

router = APIRouter()

@router.get("/price", response_model=PriceOut)
async def get_price():
    try:
        return await price.get_eth_price()
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/markets", response_model=MarketsOut)
async def get_markets():
    session = SessionLocal()
    try:
        # Seed markets if empty (demo)
        from datetime import datetime, timedelta
        if session.query(MarketModel).count() == 0:
            now = datetime.utcnow()
            # fetch base price once
            p = await price.get_eth_price()
            session.add_all([
                MarketModel(id="eth-75-up", title="The price of ETH will increase by at least 75% by tonight at 7pm.", deadline=now + timedelta(hours=12), base_price=p["current_price"], status="open"),
                MarketModel(id="eth-no-change", title="The price of ETH will not change at all.", deadline=now + timedelta(hours=6), base_price=p["current_price"], status="open"),
            ])
            session.commit()
        # Close markets past deadline
        from datetime import datetime as dt
        now = dt.utcnow()
        for m in session.query(MarketModel).all():
            if m.status == "open" and m.deadline <= now:
                m.status = "closed"
        session.commit()
        items = [
            MarketSchema(id=m.id, title=m.title, deadline=m.deadline, status=m.status, outcome=m.outcome)
            for m in session.query(MarketModel).order_by(MarketModel.deadline.asc()).all()
        ]
        return MarketsOut(items=items)
    except Exception as e:
        session.rollback()
        raise HTTPException(500, str(e))
    finally:
        session.close()


@router.get("/markets/{market_id}", response_model=MarketSchema)
async def get_market(market_id: str):
    session = SessionLocal()
    try:
        m = session.get(MarketModel, market_id)
        if not m:
            raise HTTPException(404, "Market not found")
        return MarketSchema(id=m.id, title=m.title, deadline=m.deadline, status=m.status, outcome=m.outcome)
    finally:
        session.close()


@router.post("/markets/{market_id}/bets", response_model=BetOut)
async def create_bet(market_id: str, bet: BetCreate):
    try:
        session = SessionLocal()
        mk = session.get(MarketModel, market_id)
        if not mk:
            raise HTTPException(404, "Market not found")
        if mk.status != "open":
            raise HTTPException(400, "Market is not open for betting")
        db_bet = Bet(
            market_id=market_id,
            side=bet.side,
            amount=bet.amount,
            user_address=bet.user_address,
        )
        session.add(db_bet)
        session.commit()
        session.refresh(db_bet)
        return BetOut(
            id=db_bet.id,
            market_id=db_bet.market_id,
            side=db_bet.side,
            amount=db_bet.amount,
            user_address=db_bet.user_address,
            created_at=db_bet.created_at,
            status=db_bet.status,
            payout_amount=db_bet.payout_amount,
        )
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try:
            session.close()
        except Exception:
            pass


@router.post("/markets/{market_id}/resolve", response_model=MarketSchema)
async def resolve_market(market_id: str):
    session = SessionLocal()
    try:
        from datetime import datetime as dt
        m = session.get(MarketModel, market_id)
        if not m:
            raise HTTPException(404, "Market not found")
        if m.status == "resolved":
            return MarketSchema(id=m.id, title=m.title, deadline=m.deadline, status=m.status, outcome=m.outcome)
        # Close if past deadline
        now = dt.utcnow()
        if m.deadline > now:
            raise HTTPException(400, "Market not yet closed")
        m.status = "closed"
        # Fetch current price and compute outcome for demo rules
        p = await price.get_eth_price()
        current = float(p["current_price"]) if isinstance(p, dict) else float(p.current_price)
        # Demo rule: eth-75-up -> YES if current >= base_price * 1.75
        outcome = None
        if m.id == "eth-75-up":
            outcome = "YES" if current >= m.base_price * 1.75 else "NO"
        elif m.id == "eth-no-change":
            # within +/- 0.1% considered no change
            outcome = "YES" if abs(current - m.base_price) <= m.base_price * 0.001 else "NO"
        else:
            outcome = "NO"
        m.outcome = outcome
        m.status = "resolved"
        # Pay out winners (demo: 2x amount for winners, 0 for losers)
        bets = session.query(Bet).filter(Bet.market_id == m.id).all()
        for b in bets:
            if b.side == outcome:
                b.status = "won"
                b.payout_amount = round(b.amount * 2.0, 2)
            else:
                b.status = "lost"
                b.payout_amount = 0.0
        session.commit()
        return MarketSchema(id=m.id, title=m.title, deadline=m.deadline, status=m.status, outcome=m.outcome)
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(500, str(e))
    finally:
        session.close()


@router.get("/users/{user_address}/bets", response_model=UserBetsOut)
async def get_user_bets(user_address: str):
    session = SessionLocal()
    try:
        rows = session.query(Bet).filter(Bet.user_address == user_address).order_by(Bet.created_at.desc()).all()
        return UserBetsOut(items=[
            BetOut(
                id=b.id,
                market_id=b.market_id,
                side=b.side,
                amount=b.amount,
                user_address=b.user_address,
                created_at=b.created_at,
                status=b.status,
                payout_amount=b.payout_amount,
            ) for b in rows
        ])
    finally:
        session.close()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        msg = await gemini.chat(req.prompt)
        return ChatResponse(message=msg, timestamp=datetime.utcnow())
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/chain/abi")
async def get_contract_abi():
    """Serve contract ABI to frontend. Looks for ABI in shared artifacts volume.

    Expected path (when using arena-sc dev compose):
      /artifacts/artifacts/contracts/PredictionArena.sol/PredictionArena.json
    Fallback paths are tried as well.
    """
    candidates = [
        "/artifacts/artifacts/contracts/PredictionArena.sol/PredictionArena.json",
        "/artifacts/contracts/PredictionArena.sol/PredictionArena.json",
        "./artifacts/contracts/PredictionArena.sol/PredictionArena.json",
    ]
    for p in candidates:
        try:
            if os.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    abi = data.get("abi", [])
                    return JSONResponse(content=abi)
        except Exception:
            continue
    raise HTTPException(status_code=404, detail="Contract ABI not found")


@router.get("/chain/info")
async def get_chain_info():
    """Return chain info including contract address and optional chain_id."""
    from config import get_settings  # local import to avoid circular

    s = get_settings()
    out = {
        "address": s.contract_address,
        "chainId": s.chain_id,
    }
    return JSONResponse(content=out)

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
