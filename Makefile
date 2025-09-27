.PHONY: help docker-build docker-run docker-up docker-down docker-logs docker-test docker-migrate docker-revise env example-env clean

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

docker-test:
	@echo Starting database service...
	docker compose up -d postgres
	@echo Running tests inside API service container
	docker compose run --rm api pytest -q

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
