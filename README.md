# DriveRent

A FastAPI + PostgreSQL backend for a university car rental project. Includes registration,
JWT authentication, a searchable catalog, hourly/daily pricing, long-term discounts,
bookings, administrator workflows and rule-based car recommendations.

## Requirements

- Docker with Compose v2.
- [uv](https://docs.astral.sh/uv/getting-started/installation/) for local Python development
  and tests. `uv sync` installs the project's Python 3.12 automatically.

## Run with Docker

From the repository root:

1. Copy `.env.example` to `.env`.
2. Replace `POSTGRES_PASSWORD` with a random alphanumeric password, and use the same
   password in `DATABASE_URL`. Set `JWT_SECRET` to a random secret of at least 32 characters.
3. Run:

```sh
docker compose up -d --wait db
docker compose build api
docker compose run --rm api .venv/bin/alembic upgrade head
docker compose run --rm api .venv/bin/python -m app.cli seed
docker compose up -d --wait api
```

- [Swagger / API documentation](http://localhost:8000/docs)
- [OpenAPI JSON](http://localhost:8000/openapi.json)
- [Database health check](http://localhost:8000/health)

The catalog seed adds 12 cars and requires an empty catalog. It never changes existing cars.
Demo photos are illustrative placeholders; replace their URLs using the administrator API.
Migrations run explicitly, not automatically when the application starts.

## Create an administrator

Provide a password through the environment (8–128 characters). In Bash or Zsh:

```sh
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
docker compose run --rm -e ADMIN_PASSWORD api .venv/bin/python -m app.cli create-admin \
  --email admin@example.com --name Administrator
unset ADMIN_PASSWORD
```

The command refuses to overwrite an existing account. Registration always creates a regular
user; roles cannot be chosen through the public API. No administrator password is built in.

## Develop without the API container

Keep PostgreSQL running through Compose. From `backend/`:

```sh
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Stop the Compose API first if it is already using port 8000: `docker compose stop api`.
The application loads `.env` from the repository root. Environment variables take precedence.
To create an administrator locally, export `ADMIN_PASSWORD` and run:

```sh
uv run python -m app.cli create-admin --email admin@example.com --name Administrator
```

Use `uv run python -m app.cli seed` to populate an empty local database.

## Test and check

From the repository root:

```sh
docker compose --profile test up -d --wait test-db
```

Then, from `backend/`:

```sh
uv sync --frozen
uv run ruff check .
uv run ruff format --check .
uv run --env-file ../.env pytest
uv run alembic check
```

Tests use `TEST_DATABASE_URL`, apply Alembic migrations and clear the test tables before
each case. The database name must end with `_test`. Compose exposes this separate database
on port 5434; the development database is on 5433. Never point tests at an application database.

The suite covers authorization, validation, pricing boundaries, immutable price snapshots,
availability, adjacent rentals, concurrent booking requests, database overlap constraints,
status transitions, statistics and recommendations. It uses real PostgreSQL, not SQLite or
mock database responses.

GitHub Actions runs Ruff, clean-database migrations, schema drift detection and the full suite.

## Frontend handoff

The React frontend uses `http://localhost:8000/api/v1`. Set `VITE_API_URL` to this value
in the frontend project. The API permits `http://localhost:5173` by default; set
`CORS_ORIGINS` to a JSON array of actual frontend origins, including production when deployed.

- [API contract and request examples](docs/frontend.md)
- [ER diagram, pricing and concurrency rules](docs/architecture.md)
- [Defense scenario and HTTP smoke script](docs/demo.md)

Money is whole KZT. Datetimes require an explicit timezone; display them in `Asia/Almaty`.
The OpenAPI schema is the source of truth for request and response fields.

## Deploy to Render

`render.yaml` describes a Docker web service and PostgreSQL 16. The blueprint uses **paid**
`starter` / `basic-256mb` plans so migrations can run in the separate pre-deploy step.
Review pricing in Render before creating these resources.

1. Publish the repository to GitHub, then create a Render Blueprint from `render.yaml`.
2. Supply `CORS_ORIGINS` as a JSON array, for example `["https://your-frontend.vercel.app"]`.
   Render generates the JWT secret and supplies the private database connection string.
3. Render builds the Dockerfile, runs `.venv/bin/alembic upgrade head` before the deployment,
   and checks `/health`. HTTPS terminates at Render; Uvicorn listens on port 8000.
4. In the service shell, create an administrator using `ADMIN_PASSWORD` from the environment,
   then run `.venv/bin/python -m app.cli seed` once for an empty database.
5. Set the frontend's `VITE_API_URL` to `https://<service>.onrender.com/api/v1` and redeploy it.
6. Run the HTTP smoke script against that HTTPS URL and verify the React scenario.

The database accepts private connections only. Deployments are manual (`autoDeploy: false`).
For another host, run the same image with `DATABASE_URL`, `JWT_SECRET` and `CORS_ORIGINS`,
and apply migrations as a separate release command. Both `postgres://` and `postgresql://`
connection strings are normalized to the psycopg driver.

The backend deployment configuration is included; creating cloud resources and deploying the
teammate's React frontend require access to those projects.

## Project boundaries

One car row represents one physical car. Pending and confirmed bookings reserve its interval;
pending bookings require an administrator decision or user cancellation and do not expire.
There are no real payments, document checks, GPS, email delivery or trained ML models.
The dashboard reports completed rental value rather than payment revenue.
