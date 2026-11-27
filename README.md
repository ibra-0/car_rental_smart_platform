# DriveRent

FastAPI + PostgreSQL backend for the DriveRent university project.

## Local development

1. Copy `.env.example` to `.env` and replace the database password and JWT secret.
2. Run `docker compose up -d --wait db` from the repository root.
3. In `backend/`, run `uv sync --frozen` and `uv run alembic upgrade head`.
4. Run `uv run uvicorn app.main:app --reload`.

API documentation: http://localhost:8000/docs. Database health: http://localhost:8000/health.

## Tests

Run `docker compose --profile test up -d --wait test-db` from the repository root.
In `backend/`, set `TEST_DATABASE_URL` from `.env.example`, then run:

```sh
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

Tests use a separate PostgreSQL database whose name must end with `_test`.
Never use an application database for tests.

## Containers

Build with `docker compose build api`. Apply migrations explicitly with
`docker compose run --rm api .venv/bin/alembic upgrade head`, then start with
`docker compose up -d api`. The API does not run migrations on startup.
