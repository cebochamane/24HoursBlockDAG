# Simple Makefile for arena-fe (frontend)
# Cross-platform: Windows (PowerShell) and Linux/macOS

ifeq ($(OS),Windows_NT)
  SHELL := powershell.exe
  .SHELLFLAGS := -NoProfile -Command
  NULL := NUL
  INSTALL_CMD := npm ci; if ($$LASTEXITCODE -ne 0) { npm install }
else
  SHELL := /bin/sh
  .SHELLFLAGS := -c
  NULL := /dev/null
  INSTALL_CMD := npm ci || npm install
endif

.PHONY: help install dev build preview lint docker-build docker-run docker-stop docker-dev compose-up compose-logs compose-down dev-stack docker-dev-stack stack-up stack-down

# Simple Makefile for arena-fe (frontend)
# Works on Windows (PowerShell) and Linux/macOS via Docker where needed

help:
	@echo "Targets:"
	@echo "  install       - Install deps (npm ci || npm install)"
	@echo "  dev           - Install deps then start Vite dev server locally"
	@echo "  build         - Build production assets via Vite"
	@echo "  preview       - Preview production build"
	@echo "  lint          - Run eslint"
	@echo "  docker-build  - Build nginx production image (arena-fe:latest)"
	@echo "  docker-run    - Run nginx image on :8080"
	@echo "  docker-stop   - Stop and remove nginx container"
	@echo "  docker-dev    - Run Vite dev server inside a Node container (installs deps in container)"
	@echo "  compose-up    - Start only the frontend service from arena-sc/dev compose"
	@echo "  dev-stack     - Bring up full stack (contracts+api+db) then run FE dev locally"
	@echo "  docker-dev-stack - Bring up full stack then run FE dev inside Node container"
	@echo "  stack-up      - Bring up full stack (contracts+api+db+frontend service)"
	@echo "  stack-down    - Tear down full stack"
	@echo "  compose-logs  - Tail frontend service logs"
	@echo "  compose-down  - Remove the frontend service container"

install:
	@$(INSTALL_CMD)

dev:
	@$(INSTALL_CMD)
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

# --- Docker (prod) ---

docker-build:
	docker build -t arena-fe:latest .

docker-run: docker-stop
	docker run -d --name arena-fe -p 8080:80 arena-fe:latest

# Stop if running (ignore errors if not present)
docker-stop:
	-@docker rm -f arena-fe 2> $(NULL) || true

# --- Docker (dev) ---
# Runs Vite dev server in a Node container, mounts current workspace, installs deps inside container
# Access at http://localhost:5173

docker-dev:
	docker run --rm -it -p 5173:5173 -v $$PWD:/app -w /app node:18-alpine sh -lc "npm ci || npm install && npm run dev -- --host 0.0.0.0 --port 5173"

# --- Compose helpers (re-uses arena-sc docker-compose.dev.yml) ---
# This relies on the full-stack compose we extended to include the 'frontend' service

compose-up:
	docker compose -f ../arena-sc/docker-compose.dev.yml up -d frontend

compose-logs:
	docker compose -f ../arena-sc/docker-compose.dev.yml logs -f frontend

compose-down:
	docker compose -f ../arena-sc/docker-compose.dev.yml rm -sf frontend || true

# Bring up entire stack (chain + contracts + api-dev + postgres + frontend service)

stack-up:
	docker compose -f ../arena-sc/docker-compose.dev.yml up -d --build
	@echo "Frontend: http://localhost:5173"
	@echo "Backend API (dev): http://localhost:8001"
	@echo "Hardhat RPC: http://localhost:8545"

stack-down:
	docker compose -f ../arena-sc/docker-compose.dev.yml down

# One-shot helpers: full stack then FE dev

dev-stack:
	$(MAKE) -C ../arena-sc dev-up
	$(MAKE) dev


docker-dev-stack:
	$(MAKE) -C ../arena-sc dev-up
	$(MAKE) docker-dev
