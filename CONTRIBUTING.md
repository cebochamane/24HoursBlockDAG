# Contributing to Arena

Thanks for your interest in contributing! This guide explains the dev workflow for the Arena stack.

## Core Contributors
- **Nyasha Shekede** — owner of `arena-be/` (backend)
- **Cebolenkosi Chaane** — owner of `arena-sc/` (stack/compose)
- **Uzair Mohammed** — owner of `arena-fe/` (frontend)

## Repository Structure
- `arena-fe/` — Vite/React frontend
- `arena-be/` — FastAPI backend
- `arena-sc/` — Docker Compose for local dev

## Branching & PRs
- Create feature branches from `main`: `feature/<short-description>`
- Keep PRs small and focused. Add screenshots/logs for UI/API changes.
- Reference issues in commit messages and PR descriptions when applicable.

## Code Style
- Frontend: Prettier defaults; 2-space indent. See `.editorconfig`.
- Backend: PEP8; 4-space indent; type hints encouraged.
- Keep imports at top of files.

## Backend Development
- Virtualenv recommended.
- Run API locally:
```bash
cd arena-be
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```
- Tests (add `pytest` if needed in future):
```bash
pytest -q
```

## Frontend Development
- Node 18+
```bash
cd arena-fe
npm install
npm run dev  # http://localhost:5173
```

## Docker Compose (Full Stack)
```bash
docker compose -f arena-sc/docker-compose.dev.yml up -d --build
```

## Migrations
- Dev DB migrations are executed in `arena-be/main.py` to add missing columns when running locally.
- For production, write proper Alembic migrations.

## API Contracts
- Update `arena-be/app/schemas.py` when you change response/request models.
- Document new endpoints in `README.md` and `docs/api.md` if added.

## Security
- Do NOT commit secrets.
- Use env vars for keys. See `arena-be/.env` template.

## Reporting Issues
- Include steps to reproduce, expected vs actual, and relevant logs.
- Label issues appropriately: `bug`, `feature`, `docs`, etc.
