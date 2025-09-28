<<<<<<< HEAD
.PHONY: help docker-build docker-run docker-up docker-down docker-logs docker-test docker-migrate docker-revise env example-env clean \
	smoke-health smoke-price smoke-predict smoke-leaderboard smoke-all test-llm

help:
	@echo "Available targets:"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-run     - Run container (detached)"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-run     - Run container (detached)"
	@echo "  docker-up      - docker-compose up (prod/dev services)"
	@echo "  docker-down    - docker-compose down"
	@echo "  docker-logs    - Tail logs from docker-compose"
	@echo "  docker-test    - Run pytest inside api service"
	@echo "  docker-migrate - Run alembic upgrade head inside api"
	@echo "  docker-revise  - Create a new alembic revision (NAME=message)"
	@echo "  env            - Create .env from .env.example if missing"
	@echo "  example-env    - Overwrite .env from .env.example"
	@echo "  clean          - Remove caches and build artifacts"
	@echo "  smoke-health   - Curl /health on API_URL and API_DEV_URL"
	@echo "  smoke-price    - Curl /api/v1/price on API"
	@echo "  smoke-predict  - POST /api/v1/predict with sample payload"
	@echo "  smoke-leaderboard - Curl /api/v1/leaderboard"
	@echo "  smoke-all      - Run all smoke tests (health, price, predict, leaderboard)"
	@echo "  test-llm       - Run only LLM unit tests (tests/test_gemini.py) in docker"

# Configurable API URLs for smoke tests
API_URL ?= http://localhost:8000
API_DEV_URL ?= http://localhost:8002
TEST_ADDRESS ?= 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

docker-build:
	docker build -t prediction-league-backend:latest .

docker-run:
	docker run -d --name prediction-league-api -p 8000:8000 --env-file .env prediction-league-backend:latest

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# --- Smoke tests (Windows-friendly) ---
smoke-health:
	@echo Checking health on $(API_URL)/health and $(API_DEV_URL)/health
	-@curl -s -o NUL -w "API %{{http_code}} -> $(API_URL)/health\n" $(API_URL)/health
	-@curl -s -o NUL -w "API-DEV %{{http_code}} -> $(API_DEV_URL)/health\n" $(API_DEV_URL)/health

smoke-price:
	@echo GET $(API_URL)/api/v1/price
	-@curl -s -f $(API_URL)/api/v1/price | python -c "import sys,json;print(json.dumps(json.load(sys.stdin), indent=2))"

smoke-predict:
	@echo POST $(API_URL)/api/v1/predict
	-@curl -s -f -H "Content-Type: application/json" -d "{\"user_address\":\"$(TEST_ADDRESS)\",\"prediction_value\":4200.0}" $(API_URL)/api/v1/predict | python -c "import sys,json;print(json.dumps(json.load(sys.stdin), indent=2))"

smoke-leaderboard:
	@echo GET $(API_URL)/api/v1/leaderboard
	-@curl -s -f $(API_URL)/api/v1/leaderboard | python -c "import sys,json;print(json.dumps(json.load(sys.stdin), indent=2))"

smoke-all: smoke-health smoke-price smoke-predict smoke-leaderboard

docker-test:
	@echo Starting database service...
	docker compose up -d postgres
	@echo Running tests inside API service container
	docker compose run --rm api pytest -q

test-llm:
	@echo Running LLM tests inside API service container
	docker compose run --rm api pytest -q tests/test_gemini.py

docker-migrate:
	docker compose run --rm api alembic upgrade head

docker-revise:
	@if not defined NAME (echo Usage: make docker-revise NAME=short_message && exit 1) else (docker compose run --rm api alembic revision -m "$(NAME)")

env:
	@if not exist .env (copy .env.example .env >nul) else (echo .env exists)

example-env:
	copy /Y .env.example .env

clean:
	@echo Cleaning caches and build artifacts
	@if exist __pycache__ rmdir /S /Q __pycache__
	@if exist .pytest_cache rmdir /S /Q .pytest_cache
	@if exist *.pyc del /Q *.pyc
	@if exist *.pyo del /Q *.pyo
=======
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
>>>>>>> c2a0b5aaace703144dd68ddd23343cb3ec8ca514
