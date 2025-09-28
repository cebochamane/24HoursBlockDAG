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
