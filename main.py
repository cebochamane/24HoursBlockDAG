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
from contextlib import asynccontextmanager

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Backend online – Gemini + ML + Blockchain")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("DB tables ensured via metadata.create_all")
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",") if o.strip()],
    allow_credentials=True,
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
