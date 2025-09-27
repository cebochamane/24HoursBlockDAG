# AI-vs-Human Prediction League - Backend

Production-ready FastAPI backend powering the AI-vs-Human Prediction League. Docker-only workflow with Postgres, structured JSON logs, request IDs, and Prometheus metrics.

---

## Quickstart (Docker-only)

```bash
# 1) Configure environment
copy .env.example .env
# adjust ALLOWED_ORIGINS and keys as needed

# 2) Start stack (API + Postgres)
docker compose up -d --build

# 3) Endpoints
# API:       http://localhost:8000
# API (dev): http://localhost:8001
# Metrics:   http://localhost:8000/metrics
```

Make targets:
```bash
make docker-build # build image
make docker-up    # compose up -d
make docker-down  # compose down
make docker-logs  # tail logs
make docker-test  # run pytest in container
make docker-migrate # alembic upgrade head
make docker-revise NAME="init tables" # create migration
```

---

## Configuration

Settings via `.env` (see `.env.example`).

 - `ALLOWED_ORIGINS` comma-separated list of domains for CORS (production-only). Example: `https://your-frontend.example.com`.
 - `DATABASE_URL` defaults to Postgres in Compose: `postgresql+psycopg2://app:app@postgres:5432/prediction`.
 - `GEMINI_API_KEY` optional; fallback reasoning is used if empty.
 - `PRIVATE_KEY` optional; blockchain txs simulated if empty.

---

## API

Base: `http://localhost:8000`

- GET `/` - service info
- GET `/health` - health probe
- GET `/metrics` - Prometheus metrics
- GET `/api/v1/price` - ETH price with 24h delta and market cap
- POST `/api/v1/predict` - 7-day AI forecast, Gemini reasoning, simulated tx
- GET `/api/v1/leaderboard` - DB-backed leaderboard
 - POST `/api/v1/users/register` - Register or update a user by wallet address
 - GET `/api/v1/users/{user_address}` - Fetch a registered user

Example predict payload:
```json
{
  "user_address": "0x74232704659A37D66D6a334eF3E087eF6c139414",
  "prediction_value": 2600
}
```

---

## Code Structure

- `main.py` - FastAPI app; production CORS, request IDs, Prometheus metrics, DB bootstrap.
- `config.py` - `Settings` via `pydantic-settings`
- `app/api/routes.py` - API endpoints; exports `api_router`
- `app/schemas.py` - Pydantic models
- `app/services/` - Service layer
  - `price_service.py` - Coingecko fetch with cache + simulated fallback
  - `ml_service.py` - Linear regression cold-start forecaster
  - `gemini_service.py` - Gemini sentiment with safe fallback
  - `blockchain_service.py` - Web3 client + simulated tx storage
  - `leaderboard_service.py` - DB-backed leaderboard with initial seeding
  - `__init__.py` - exposes singletons: `price`, `ml`, `gemini`, `blockchain`, `leaderboard`
- `app/utils/` - Utilities
  - `cache.py` - simple TTL async decorator
  - `logger.py` - structured JSON logger with request IDs
- `app/middleware/` - Request ID middleware
- `app/db/` - SQLAlchemy models and session
  - `models.py` - `LeaderboardEntry`
  - `session.py` - engine/session
- `alembic/` - migrations & config
- `tests/` - unit tests

---

## Observability & Reliability

- Structured JSON logs with request IDs (`X-Request-ID`).
- Prometheus metrics at `/metrics`.
- `/health` endpoint used for Compose healthchecks.
- Aiohttp Coingecko request has a 5s timeout and falls back to simulation.

Rate limiting:
- Simple per-IP rate limiting via middleware with `RATE_LIMIT_RPM` (default 120) in `.env`.
- Headers exposed: `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

---

## Security Notes

- `.env` not committed; `.env.example` is the template.
- Restrict `ALLOWED_ORIGINS` in production to your real frontend domains.
- If `PRIVATE_KEY` unset, blockchain writes are simulated. Never log secrets.

---

## Testing (in Docker)

```bash
make docker-test
```

Tests cover root, price, predict, leaderboard, metrics, and error paths.

---

## Deployment

- Container image built via `Dockerfile` (Python 3.11-slim, system deps for scientific stack).
- `docker-compose.yml` defines `api` (prod) and `api-dev` (autoreload) services and a Postgres service.
- API services run Alembic migrations on startup before launching.
- Ready for any orchestrator (ECS, GKE, AKS, K8s) with a standard health probe and metrics endpoint.

---

## Application-level security (recommended)

- API Gateway: Place this service behind a gateway (e.g., Cloudflare, Nginx, Kong, API Gateway) to enforce rate limiting, WAF rules, JWT auth, and TLS termination.
- Authn/Z: If you require account-level features beyond wallet address registration, add JWT/OIDC validation at the gateway or via FastAPI dependencies.
- Network policy: Restrict DB to accept connections only from the API network.

---

## Metrics enhancements

- Request counters and histograms are emitted via middleware on every request.
- Suggested next steps: add custom business metrics (prediction counts per user, error rates per provider, cache hit rates).

---

## Advanced models and build performance

- Prophet and other heavier frameworks are currently removed to keep builds fast.
- If reintroducing:
  - Prebuild wheels in a base image to reduce cold build times.
  - Or maintain a separate model-serving microservice image for ML workloads.

---

## CI

GitHub Actions workflow runs lint (ruff), type checks (mypy), tests, Docker build, Trivy image scan, and Bandit static analysis.
