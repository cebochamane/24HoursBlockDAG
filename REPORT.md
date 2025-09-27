# CTO Report – AI‑vs‑Human Prediction League Backend

Date: 2025-09-27
Owner: Backend Platform

## Executive Summary

The backend repository is production‑ready with robust defaults and safe fallbacks where external secrets are absent. It offers deterministic API contracts, containerization, a make‑based DX on Windows, caching, structured JSON logging with request IDs, and Prometheus metrics. The system can run entirely offline via simulated price, LLM, and blockchain flows and seamlessly switches to real providers when credentials are supplied.

## Architecture Overview

- Framework: FastAPI (`main.py`) with CORS and versioned API routing via `app/api/routes.py`.
- Configuration: `config.py` using `pydantic-settings` with `.env` support and Pydantic v2 `model_config`.
- Services (`app/services/`):
  - `price_service.py`: Price fetch via Coingecko + async TTL cache; simulation fallback on failure.
  - `ml_service.py`: Linear regression cold‑start forecaster; synthetic 100‑day trend.
  - `gemini_service.py`: Gemini LLM sentiment analysis with deterministic fallback copy when no API key or on error.
  - `blockchain_service.py`: Web3 client stub + simulated transaction hash when no private key (ready to wire to real contract).
  - `leaderboard_service.py`: DB‑backed leaderboard (SQLAlchemy) with initial seeding when empty.
- Utilities: `app/utils/cache.py` (async TTL cache) and `app/utils/logger.py` (structured JSON logger injecting `request_id`).
- Schemas: `app/schemas.py` defines request/response validation.
- Middleware: `app/middleware/` for `RequestIdMiddleware`, `RateLimitMiddleware`, and `MetricsMiddleware`.
- Database: `app/db/models.py`, `app/db/session.py` with Alembic migrations under `alembic/`.
- Tests: `tests/` cover root, price, predict, leaderboard, metrics.
- Containerization: `Dockerfile` based on python:3.11‑slim with build deps; `docker-compose.yml` for prod and dev (reload); `.dockerignore` in place.
- DX: `Makefile` provides Docker‑only workflow; no local Python required.

## Audit Findings

- Imports and Wiring
  - `main.py` uses FastAPI Lifecycle API (no deprecated startup events). Exposes `/metrics`, applies CORS, and registers middlewares.
  - `app/api/routes.py` exports `api_router`. User registration endpoints are behind a feature flag and disabled by default.
  - `app/services/__init__.py` exposes singletons (`price`, `ml`, `gemini`, `blockchain`, `leaderboard`).
  - `gemini_service.py` and `blockchain_service.py` import `get_settings` from root `config.py` for consistent module paths.
  - `alembic/env.py` ensures project root is on `sys.path` to import `app` during migrations.

- Dependencies
  - Key runtime packages: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `pydantic-settings`, `aiohttp`, `web3`, `prometheus_client`, `python-json-logger`, `scikit-learn`, `numpy`.
  - Heavy model libs like `prophet` are intentionally omitted to keep builds fast; can be reintroduced later with prebuilt wheels/base images.

- Resilience
  - Coingecko requests timeout after 5s; on failure, a realistic simulated price object is returned.
  - Gemini failures or missing API key return deterministic fallback reasoning.
  - Blockchain writes simulate a transaction hash if a private key is not provided.
  - API response models validated by FastAPI/Pydantic ensure consistent response contracts.

- Security
  - `.env` excluded from VCS; `.env.example` documents required keys and feature flags.
  - CORS is configured via `ALLOWED_ORIGINS` and should be restricted to real frontends in production.
  - Rate limiting enforced in‑app per IP via `RATE_LIMIT_RPM`; recommend adding an API gateway/WAF in front for production.

- Observability
  - Structured JSON logs with `X-Request-ID` correlation.
  - Prometheus metrics via middleware: request counters and duration histograms; exposed at `/metrics`.
  - Health endpoint `/health` used by Compose healthchecks.

## Risks and Mitigations

- External Provider Risk: Price/LLM providers may rate limit. Caching and fallbacks reduce fragility. For production, add exponential backoff and provider redundancy.
- Security Posture: Ensure `ALLOWED_ORIGINS` is restricted; keep `PRIVATE_KEY` out of logs and use a secrets manager.
- DB Migrations: Alembic is wired and runs pre‑startup; keep migrations reviewed and versioned.

- Testing Coverage: Current tests are solid smoke/contract level. Expand with provider failure simulations and schema golden files as scope grows.

## Recommendations (Next Iterations)

1. Wire `blockchain_service.py` to a real contract (load ABI, sign, and send txs) or delegate to a dedicated signer service.
2. Add API gateway/WAF, JWT/OIDC where needed, and route‑level rate limits at the edge.
3. Introduce richer business metrics (prediction counts per user, provider error rates, cache hit rates).
4. Harden dependencies with hashes and enable dependabot/renovate.
5. If heavy models are reintroduced, prebuild wheels in a base image to keep CI fast.

## Runbooks

- Docker‑only Quickstart: see README Quickstart; ensure `.env` exists (keys optional for fallbacks).
- Compose: `make docker-up` to start; healthchecks wired; `make docker-logs` to tail.
- Tests: `make docker-test` runs pytest inside the container.
- Migrations: `make docker-migrate` to upgrade; `make docker-revise NAME="message"` to create a revision.

## Conclusion

The repository is in a healthy, production‑readiness baseline with strong fallbacks, containerization, and DX ergonomics. It is safe to deploy behind an API gateway. Production hardening items (edge security, gateway auth, richer metrics, and optional real blockchain wiring) can be scheduled in the next sprint.
