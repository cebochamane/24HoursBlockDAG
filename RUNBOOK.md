# Arena Runbook

This runbook describes the exact commands and sequence to bring up, test, and troubleshoot the Arena stack on a developer machine.

## Prerequisites
- Docker + Docker Compose
- Windows PowerShell for the provided commands (adapt as needed for other shells)

## Bring Up the Stack
```powershell
# From repo root
docker compose -f arena-sc/docker-compose.dev.yml up -d --build
```

Verify containers:
```powershell
docker compose -f arena-sc/docker-compose.dev.yml ps
```

Tail backend logs (optional):
```powershell
docker compose -f arena-sc/docker-compose.dev.yml logs -f api-dev
```

## Health Checks
```powershell
# Backend health
Invoke-RestMethod -Method GET -Uri http://localhost:8001/health

# Markets (will seed demo markets on first call)
Invoke-RestMethod -Method GET -Uri http://localhost:8001/api/v1/markets
```

## Basic E2E Test Flow
1) Open the frontend:
```powershell
Start-Process http://localhost:5173
```

2) Place a bet (via API or UI). API example:
```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:8001/api/v1/markets/eth-75-up/bets `
  -ContentType 'application/json' `
  -Body '{"side":"YES","amount":25.00,"user_address":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'
```

3) Get AI advice (optional from UI, or API example):
```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:8001/api/v1/predict `
  -ContentType 'application/json' `
  -Body '{"market_id":"eth-75-up","side":"YES","amount":25.00}'
```

4) Force-close a market for testing (dev only):
```powershell
docker compose -f arena-sc/docker-compose.dev.yml exec postgres psql -U app -d prediction -c "UPDATE markets SET deadline = now() - interval '1 minute' WHERE id = 'eth-75-up';"
```

5) Resolve the market:
```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:8001/api/v1/markets/eth-75-up/resolve
```

6) Check user bets (status + (demo) payout):
```powershell
Invoke-RestMethod -Method GET -Uri http://localhost:8001/api/v1/users/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/bets
```

7) View in frontend:
- The “My Bets” panel polls every 15s and will toast when a pending bet turns won/lost.
- Market tiles display status (Open/Closed/Resolved) and outcome once resolved.

## Makefile Targets (from repo root)
```make
make up         # Start full stack via docker compose
make down       # Stop stack
make logs       # Tail api + fe logs
make ps         # Show compose services
make rebuild    # Rebuild and restart api + fe
make be-logs    # Tail backend logs
make fe-logs    # Tail frontend logs
make db-psql    # Open psql in Postgres container
make api        # Hit backend health and markets
make health     # Health check
make fe-open    # Open frontend URL
make clean      # Remove containers and volumes (dangerous)
```

## Troubleshooting
- API refuses connections → check backend logs:
```powershell
docker compose -f arena-sc/docker-compose.dev.yml logs -f api-dev
```
- NameError around `Market` → ensure `app/api/routes.py` uses `MarketModel` for DB and `MarketSchema` for responses.
- UndefinedColumn on `bets.status` → restart API; dev migration in `arena-be/main.py` will add missing columns.
- No notifications → ensure `Toasts` is mounted (in `arena-fe/src/App.jsx`) and MyBets polling is active.
- Frontend stale UI → hard refresh (Ctrl+F5) or recreate FE container.

## Cleaning Up
```powershell
# Stop and remove containers and volumes (DANGEROUS)
make clean
```
