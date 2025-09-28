# Arena Backend (arena-be)

FastAPI backend powering the Arena prediction market. Provides market, bets, users, and AI endpoints with Postgres storage, structured logs, request IDs, and Prometheus metrics.

---

## Quickstart (with root compose)

```bash
# From repo root
docker compose -f arena-sc/docker-compose.dev.yml up -d --build

# Endpoints
# API (dev): http://localhost:8001
# Docs:      http://localhost:8001/docs
# Metrics:   http://localhost:8001/metrics
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

Base: `http://localhost:8001`

- GET `/health` — health probe
- GET `/metrics` — Prometheus metrics
- GET `/api/v1/price` — ETH price snapshot
- POST `/api/v1/predict` — AI forecast + Gemini reasoning + demo tx

Markets
- GET `/api/v1/markets` — list markets; seeds demo markets if empty; auto-closes past deadline
- GET `/api/v1/markets/{id}` — get a market (`status`, `outcome`)
- POST `/api/v1/markets/{id}/bets` — create bet while market is open
- POST `/api/v1/markets/{id}/resolve` — resolve market after deadline; marks bets won/lost with demo payouts

Users
- GET `/api/v1/users/{address}/bets` — list a user’s bets with status and payout_amount

---

## Code Structure

- `main.py` - FastAPI app; production CORS, request IDs, Prometheus metrics, DB bootstrap.
- `config.py` - `Settings` via `pydantic-settings`
- `app/api/routes.py` - API endpoints; exports `api_router`
- `app/schemas.py` - Pydantic models
- `app/services/` — Service layer singletons: `price`, `ml`, `gemini`, `blockchain`, `leaderboard`
- `app/services/price_service.py` — price fetch with fallback
- `app/services/ml_service.py` — basic forecaster
- `app/services/gemini_service.py` — AI reasoning with fallback
- `app/services/blockchain_service.py` — simulated tx
- `app/services/leaderboard_service.py` — leaderboard utils
- `app/utils/` - Utilities
  - `cache.py` - simple TTL async decorator
  - `logger.py` - structured JSON logger with request IDs
- `app/middleware/` - Request ID middleware
- `app/db/` — SQLAlchemy models and session
  - `models.py` — `Market`, `Bet`, `LeaderboardEntry`
  - `session.py` — engine/session
- `alembic/` - migrations & config
- `tests/` - unit tests

---

## Models & Resolution

- `Market`: `id`, `title`, `deadline`, `status` (open/closed/resolved), `outcome`, `base_price`
- `Bet`: `id`, `market_id`, `side` (YES/NO), `amount`, `user_address`, `status` (pending/won/lost), `payout_amount`

Resolution (demo logic):
- `eth-75-up`: YES if `current_price >= base_price * 1.75`, else NO
- `eth-no-change`: YES if absolute change <= 0.1% * base_price, else NO
- Winners get `2x` payout_amount; losers get `0`

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

## Dev Migration

For local/dev, `main.py` applies a lightweight migration at startup to add missing columns to `bets` (e.g., `status`, `payout_amount`). For production, add proper Alembic migrations.

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
