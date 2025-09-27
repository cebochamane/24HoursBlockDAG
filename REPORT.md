# CTO Report – AI‑vs‑Human Prediction League Backend

Date: 2025-09-27
Owner: Backend Platform

## Executive Summary

The backend repository is production‑ready with robust defaults and safe fallbacks where external secrets are absent. It offers deterministic API contracts, containerization, a make‑based DX on Windows, caching, logging, and basic tests. The system can run entirely offline via simulated price, LLM, and blockchain flows and seamlessly switches to real providers when credentials are supplied.

## Architecture Overview

- Framework: FastAPI (`main.py`) with CORS and versioned API routing via `app/api/routes.py`.
- Configuration: `config.py` using `pydantic-settings` with `.env` support; reasonable defaults.
- Services (`app/services/`):
  - `price_service.py`: Price fetch via Coingecko + async TTL cache; simulation fallback on failure.
  - `ml_service.py`: Linear regression cold‑start forecaster; synthetic 100‑day trend.
  - `gemini_service.py`: Gemini LLM sentiment analysis with deterministic fallback copy when no API key or on error.
  - `blockchain_service.py`: Web3 client instantiated; simulated transaction hash when no private key.
  - `leaderboard_service.py`: Static demo data; ready to replace with DB queries.
- Utilities: `app/utils/cache.py` (async TTL cache) and `app/utils/logger.py` (INFO‑level logger).
- Schemas: `app/schemas.py` defines request/response validation.
- Tests: `tests/test_basic.py` for smoke coverage of root and price endpoint.
- Containerization: `Dockerfile` based on python:3.11‑slim with scientific stack build deps; `docker-compose.yml` for prod and dev (reload) services; `.dockerignore` in place.
- DX: `Makefile` tailored for Windows paths for venv and command executables.
- Docs: `README.md` with Quickstart, API, and operations guidance.

## Audit Findings

- Imports and Wiring
  - `main.py` imports `api_router` from `app/api/routes.py` which is now explicitly exported (`api_router = router`).
  - `app/services/__init__.py` exposes singletons (`price`, `ml`, `gemini`, `blockchain`, `leaderboard`) allowing `from app.services import ...` pattern.
  - `gemini_service.py` and `blockchain_service.py` now import `get_settings` from root `config.py`, ensuring module path consistency in all run modes (local, Docker).
  - `app/api/__init__.py` added so `app.api.routes` imports reliably as a package.

- Dependencies
  - Added `pydantic-settings==2.6.0` to `requirements.txt` to satisfy `config.py` import.
  - Extra scientific deps (`prophet`, `pandas`, `numpy`, `scikit-learn`) are present; only `numpy` and `scikit-learn` are required at runtime today. Retained for future modeling expansion; build deps installed in Docker image.

- Resilience
  - Coingecko requests timeout after 5s; on failure, a realistic simulated price object is returned.
  - Gemini failures or missing API key return deterministic, concise fallback reasoning.
  - Blockchain writes simulate a transaction hash if a private key is not provided.
  - API response models are validated by FastAPI/Pydantic ensuring consistent response contracts.

- Security
  - `.env` excluded from VCS. `.env.example` documents required keys.
  - CORS is permissive (`*`) suitable for early environments; recommend restricting in production.
  - No secrets are logged; logger is INFO‑level. No PII expansion.

- Observability
  - Health endpoint `/health` used by Docker and compose healthchecks.
  - Logging via `app/utils/logger.py`. Consider structured logging/JSON later.

## Risks and Mitigations

- Build Risk (Prophet): `prophet` can be heavy on slim images. We preinstall toolchain (`build-essential`, `g++`, `libgomp1`). If CI build times are excessive, consider removing `prophet` until it is actually used or building a base image layer with compiled wheels.
- Rate Limits/External Flux: Price provider and LLM calls may rate limit. Caching and fallbacks reduce fragility. For production, add exponential backoff and provider redundancy (e.g., CryptoCompare fallback).
- Security Posture: CORS currently `*`. Tighten to known frontends in production. Ensure `PRIVATE_KEY` is never present in logs; use secret stores (AWS SM/Azure KV/GCP SM).
- Testing Coverage: Current tests are smoke level. Expand with contract tests for every endpoint and simulate provider failures.

## Recommendations (Next Iterations)

1. Introduce database (Postgres) for persistent leaderboard; add migrations (Alembic) and a DAL layer.
2. Add CI: lint (ruff), type checks (mypy), tests, Docker build, and vulnerability scan (trivy/grype).
3. Implement structured logging and request ID middleware; expose metrics endpoint and tracing headers.
4. Add feature flags for switching providers and ML models.
5. Harden requirements with hashes and dependabot/renovate.
6. Expand test suite with golden files for schemas and ACID checks for persistence layer when introduced.

## Runbooks

- Local dev (venv): see README Quickstart. Ensure `.env` exists; keys optional.
- Docker: `docker build` then `docker run` with `--env-file .env`.
- Compose: `docker compose up -d --build` brings up prod and dev services; healthchecks wired.
- Make targets: `make install`, `make dev`, `make test`, `make docker-up`, `make docker-down`.

## Conclusion

The repository is in a healthy, production‑readiness baseline with strong fallbacks, containerization, and DX ergonomics. It is safe to deploy behind an API gateway with the caveat that certain production hardening items (CORS restriction, CI/CD, structured logging, test expansion, DB migration for leaderboard) should be scheduled in the next sprint.
