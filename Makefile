.PHONY: help up down logs ps rebuild be-logs fe-logs db-psql seed test api health fe-open clean

help:
	@echo "Arena Makefile targets:"
	@echo "  up         - Start full stack via docker compose"
	@echo "  down       - Stop stack"
	@echo "  logs       - Tail api + fe logs"
	@echo "  ps         - Show compose services"
	@echo "  rebuild    - Rebuild and restart api + fe"
	@echo "  be-logs    - Tail backend logs"
	@echo "  fe-logs    - Tail frontend logs"
	@echo "  db-psql    - Open psql in Postgres container"
	@echo "  seed       - Seed demo markets (implicit on first GET)"
	@echo "  api        - Hit backend health and markets"
	@echo "  health     - Health check"
	@echo "  fe-open    - Open frontend URL"
	@echo "  clean      - Remove containers and volumes (DANGEROUS)"

COMPOSE=docker compose -f arena-sc/docker-compose.dev.yml

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f api-dev frontend

ps:
	$(COMPOSE) ps

rebuild:
	$(COMPOSE) up -d --force-recreate --build api-dev frontend

be-logs:
	$(COMPOSE) logs -f api-dev

fe-logs:
	$(COMPOSE) logs -f frontend

db-psql:
	$(COMPOSE) exec postgres psql -U app -d prediction

seed:
	@echo "Seeding occurs automatically on first GET /api/v1/markets"

api:
	@powershell -NoProfile -Command ^
		"Invoke-RestMethod -Method GET -Uri http://localhost:8001/health | Format-Table; ^
		Invoke-RestMethod -Method GET -Uri http://localhost:8001/api/v1/markets | Format-Table"

health:
	@powershell -NoProfile -Command "Invoke-RestMethod -Method GET -Uri http://localhost:8001/health | Format-Table"

fe-open:
	@powershell -NoProfile -Command "Start-Process http://localhost:5173"

clean:
	$(COMPOSE) down -v --remove-orphans
