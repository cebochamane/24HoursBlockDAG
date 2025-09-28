# Arena Stack & Contracts (arena-sc)

This repo contains the Docker Compose and contracts tooling used to run the full Arena stack locally:

- `api-dev` — FastAPI backend (dev autoreload) on http://localhost:8001
- `frontend` — Vite/React frontend on http://localhost:5173
- `postgres` — Postgres DB for backend storage
- `hardhat` — Local Ethereum JSON-RPC node for contracts testing (http://localhost:8545)
- `contracts` — Helper container for contract compile/deploy scripts

## Quickstart

```bash
# From repo root (../arena)
docker compose -f arena-sc/docker-compose.dev.yml up -d --build

# View running services
docker compose -f arena-sc/docker-compose.dev.yml ps

# Tail backend logs
docker compose -f arena-sc/docker-compose.dev.yml logs -f api-dev
```

Open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8001 (docs at /docs)
- Hardhat JSON-RPC: http://localhost:8545

## Services

- `api-dev` (backend)
  - FastAPI with autoreload, connects to Postgres.
  - Seeds demo markets on first `GET /api/v1/markets` (if empty).
  - Provides AI advice via `/api/v1/predict` and a demo resolver endpoint.
- `frontend`
  - Vite dev server exposed on 5173, talks to backend at 8001.
- `postgres`
  - Default DB `prediction`, user `app`, password `app` (see backend `.env.example`).
- `hardhat`
  - Local chain for development and running Hardhat scripts/tests.
- `contracts`
  - Utility container to run `npm` scripts inside the `arena-sc` context.

## Directory Structure

```
arena-sc/
├─ docker-compose.dev.yml  # Compose stack
├─ contracts/              # Contracts (if any, or stubs)
├─ scripts/                # Hardhat scripts
├─ test/                   # Hardhat tests
├─ artifacts/              # Build outputs (ignored in Git)
├─ cache/                  # Hardhat cache (ignored)
├─ deployments/            # Deployed addresses (ignored)
├─ Makefile                # Convenience targets
└─ hardhat.config.cjs      # Hardhat config
```

## Useful Commands

Using the root Makefile (recommended):
```bash
make up         # Start stack
make logs       # Tail api + fe logs
make be-logs    # Tail backend logs
make fe-logs    # Tail frontend logs
make ps         # Show services
make db-psql    # Open psql in Postgres container
make clean      # Stop & remove containers+volumes (dangerous)
```

Compose/Hardhat (inside arena-sc):
```bash
# Tail hardhat container logs
docker compose -f arena-sc/docker-compose.dev.yml logs -f hardhat

# Exec into postgres and run SQL
docker compose -f arena-sc/docker-compose.dev.yml exec postgres psql -U app -d prediction

# Example: force-close a market for testing
# (from repo root; will mark the deadline as 1 minute in the past)
docker compose -f arena-sc/docker-compose.dev.yml exec postgres \
  psql -U app -d prediction -c "UPDATE markets SET deadline = now() - interval '1 minute' WHERE id = 'eth-75-up';"
```

## Ports
- Backend (api-dev): 8001
- Frontend (vite): 5173
- Hardhat (json-rpc): 8545
- Postgres: exposed to other containers only (access via `docker compose exec postgres`)

## Environment
- Backend picks up `.env` from `arena-be/.env`.
- Frontend dev server uses its local dev defaults and reaches the backend on 8001.
- Hardhat uses `hardhat.config.cjs`; accounts and chain ID configured there.

## CI/CD Notes
- This directory is intended for local development. For CI/CD, build images in `arena-be/` and `arena-fe/` and deploy to your orchestrator of choice.

## Troubleshooting
- **Backend not reachable**: Check `api-dev` logs; a Python import error or migration issue can prevent the server from starting.
- **UndefinedColumn on bets**: Restart API to trigger dev migration (see `arena-be/main.py`).
- **Frontend blank**: Hard refresh (Ctrl+F5) or check `frontend` logs and that backend is reachable on 8001.
- **Hardhat not responding**: Ensure port 8545 is free; view `hardhat` container logs.
