<<<<<<< HEAD
# Arena Backend (arena-be)

FastAPI backend powering the Arena prediction market. Provides market, bets, users, and AI endpoints with Postgres storage, structured logs, request IDs, and Prometheus metrics.

---
Here is the link to the demo zip file:https://drive.google.com/file/d/1MVF4NaFwrulQ7XIYzQI7ep6MCVEnEzE9/view?usp=drive_link

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
=======
# Arena Stack

An end-to-end demo stack for an AI-assisted prediction market.

## What is Arena?
Arena is a proof-of-concept prediction marketplace that lets users make YES/NO predictions on simple ETH price markets, get AI-assisted reasoning before placing a bet, and view outcomes once a market resolves. It showcases how a lightweight UX, an AI reasoning layer, and a simple settlement engine can work together.

- **Who it’s for**
  - Builders exploring AI + crypto market mechanics.
  - Product teams needing an end-to-end demo that spans FE + BE + chain.
  - Hackathon projects looking for a clean, minimal starting point.

- **What it demonstrates**
  - Bets persisted in a database with market deadlines and outcomes.
  - AI reasoning (Gemini) returned inline to guide user decisions.
  - A simplified resolution engine that marks bets won/lost and reports demo payouts.
  - A guest mode UX that works even without a browser wallet installed.

- **Key concepts**
  - `Market`: A YES/NO proposition with a `deadline`, `status` (open/closed/resolved), and an `outcome` once resolved.
  - `Bet`: A user’s stake on YES or NO, stored with `status` (pending/won/lost) and a demo `payout_amount`.
  - `AI Advice`: An explanation and a predicted value returned by `/predict`; an AI-bot demo tx hash is also returned.

### High-level flow
1) User selects YES/NO and a ZAR amount in the frontend (`arena-fe/`).
2) The bet is persisted via the backend (`arena-be/`) to Postgres.
3) The frontend requests AI advice (`/predict`) and displays reasoning + demo tx.
4) When the market deadline passes, a resolver endpoint computes the outcome and marks bets won/lost.
5) The frontend polls the user’s bets and shows status/payouts, with toast notifications on win/loss.

- **arena-fe/**: Vite/React frontend for placing bets, viewing AI advice, and seeing outcomes.
- **arena-be/**: FastAPI backend with price services, ML forecast, Gemini reasoning, and a demo resolution engine.
- **arena-sc/**: Docker Compose for local development (API, FE, Postgres, Hardhat chain, contracts helper).

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node 18+ (optional if running FE locally)
- Python 3.11+ (optional if running BE locally)

### Run with Docker Compose
```bash
# from repo root
docker compose -f arena-sc/docker-compose.dev.yml up -d --build

# tail logs (optional)
docker compose -f arena-sc/docker-compose.dev.yml logs -f api-dev
```

Open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8001
- Docs: http://localhost:8001/docs

## Demo
Presentation deck (Google Slides):
https://docs.google.com/presentation/d/1oVABl2m2RNK-6uWRdDAVgn6h0dkbRZLM/edit?usp=drivesdk&ouid=114319529289485321838&rtpof=true&sd=true

## Demo video (YouTube):
https://youtu.be/bySmW2U9CDE

### Health & Sanity
```powershell
Invoke-RestMethod -Method GET -Uri http://localhost:8001/health
Invoke-RestMethod -Method GET -Uri http://localhost:8001/api/v1/markets
```

## Key Features
- **Bets**: YES/NO + amount persist to Postgres via `POST /api/v1/markets/{id}/bets`.
- **AI Advice**: `POST /api/v1/predict` returns ML forecast, Gemini reasoning, and an AI-bot demo chain tx.
- **Resolution**: Markets are DB-backed with `status` and `outcome`. Resolve via `POST /api/v1/markets/{id}/resolve` using demo rules.
- **User Outcomes**: `GET /api/v1/users/{address}/bets` lists bet `status` and `payout_amount`. Frontend shows status badges and toasts on win/loss.
- **Guest Mode**: If no wallet is installed, the FE uses a local guest address and skips signing.

## Repository Structure
```
arena/
├─ arena-fe/                # Frontend (Vite/React)
│  ├─ src/components/       # BetBox, ChatInterface, MyBets, Toasts
│  └─ src/lib/              # api client, web3 service, toast bus
├─ arena-be/                # Backend (FastAPI)
│  ├─ app/api/              # routes.py (markets, bets, resolve, predict)
│  ├─ app/db/               # models.py (Market, Bet), session.py
│  ├─ app/services/         # price, ml, gemini, blockchain
│  └─ main.py               # app factory, CORS, health, metrics, dev DB migration
└─ arena-sc/                # Docker compose for dev
```

## Backend API

### Markets
- `GET /api/v1/markets` → `MarketsOut`
- `GET /api/v1/markets/{id}` → single Market (includes `status`, `outcome`)
- `POST /api/v1/markets/{id}/bets` → `BetOut` (persists bet; allowed only while market `open`)
- `POST /api/v1/markets/{id}/resolve` → resolves market (requires deadline passed) and updates all bet statuses

### Users
- `GET /api/v1/users/{address}/bets` → list of `BetOut` for the user

### AI
- `POST /api/v1/predict` → AI reasoning and demo chain tx

### Health & Docs
- `GET /health` → `{ status: "healthy" }`
- `GET /docs` → OpenAPI docs

## Local Development

### Frontend
```bash
# optional local dev
cd arena-fe
npm install
npm run dev   # http://localhost:5173
```

### Backend
```bash
# optional local dev
cd arena-be
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Dev DB Migration
The backend runs a lightweight migration at startup to add new columns if they don't exist (e.g., `bets.status`, `bets.payout_amount`). For production, add proper Alembic migrations.

## Resolution Logic (Demo)
- `eth-75-up`: YES if `current_price >= base_price * 1.75`, else NO.
- `eth-no-change`: YES if `|current - base_price| <= 0.1% * base_price`, else NO.
- Winners are marked `won` with `payout_amount = 2x`; losers `lost` with `0`.

## Troubleshooting
- "actively refused": The API likely crashed. Check logs:
```bash
docker compose -f arena-sc/docker-compose.dev.yml logs -f api-dev
```
- NameError around `Market` → ensure `app/api/routes.py` references `MarketModel` for DB and `MarketSchema` for responses.
- UndefinedColumn on `bets.status` → restart API to trigger dev migration in `main.py`.
- FE not updating → hard refresh (Ctrl+F5) or recreate frontend container.

## Security & Keys
- Gemini API key should be provided via environment (see `arena-be/.env`).
- Never commit private keys. The demo uses an AI-bot key server-side for chain writes.

## Contributing
See `CONTRIBUTING.md` in repo root for branching, coding standards, and release process.

## Authors
- `arena-be/` (backend): Nyasha Shekede
- `arena-sc/` (stack/compose): Cebolenkosi Chaane
- `arena-fe/` (frontend): Uzair Mohammed
>>>>>>> c2a0b5aaace703144dd68ddd23343cb3ec8ca514
