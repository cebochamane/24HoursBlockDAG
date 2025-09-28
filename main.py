import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.utils.logger import logger
from config import get_settings
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.metrics import MetricsMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from fastapi.responses import PlainTextResponse
from app.db.models import Base
from app.db.session import engine
from sqlalchemy import text, inspect
from contextlib import asynccontextmanager

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Backend online – Gemini + ML + Blockchain")
    try:
        from app.services.gemini_service import gemini
        has_key = bool(settings.gemini_api_key) or bool(__import__('os').getenv('GOOGLE_API_KEY'))
        logger.info(f"LLM configured: {'yes' if has_key else 'no'}; connected: {'yes' if getattr(gemini, 'is_connected', False) else 'no'}; model={getattr(settings, 'gemini_model', 'n/a')}")
    except Exception as e:
        logger.warning(f"LLM diagnostics failed: {e}")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("DB tables ensured via metadata.create_all")
        # Lightweight dev migration for new columns (when tables already exist)
        try:
            with engine.connect() as conn:
                insp = inspect(engine)
                cols = {c['name'] for c in insp.get_columns('bets')}
                if 'status' not in cols:
                    conn.execute(text("ALTER TABLE bets ADD COLUMN status VARCHAR(12) DEFAULT 'pending'"))
                    logger.info("DB migration: added bets.status")
                if 'payout_amount' not in cols:
                    conn.execute(text("ALTER TABLE bets ADD COLUMN payout_amount FLOAT NOT NULL DEFAULT 0"))
                    logger.info("DB migration: added bets.payout_amount")
                conn.commit()
        except Exception as mig_e:
            logger.warning(f"Dev DB migration skipped or failed: {mig_e}")
    except Exception as e:
        logger.error(f"DB init error: {e}")
    yield
    # Shutdown (no-op for now)


app = FastAPI(
    title="AI-vs-Human Prediction League",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

origins_list = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
is_wildcard = any(o == "*" for o in origins_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else origins_list,
    allow_credentials=False if is_wildcard else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(MetricsMiddleware)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "AI-vs-Human Prediction League API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/metrics")
async def metrics():
    data = generate_latest()
    return PlainTextResponse(content=data.decode("utf-8"), media_type=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
