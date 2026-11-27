# DriveRent

**A Smart Platform for Short-Term and Long-Term Car Rental** — a two-student university Final Project for Almaty, Kazakhstan. The repository contains a React frontend and a FastAPI/PostgreSQL backend.

Student 1: **Razyyev Ibrakhim (24B030181)** — frontend development, UI/UX, responsive layouts, client interactions, frontend testing and integration preparation. Student 2 owns the backend, database, authentication, booking API, business logic and recommendation algorithm.

## Frontend

React, TypeScript, Vite, Tailwind CSS, React Router, Lucide and accessible Radix UI primitives. Includes a 12-car demo fleet, search and filters, date-based rental estimates, booking/cancellation, customer history, demo sign-in, recommendations and administration.

Use Node.js 26 and npm 11 or newer. From the repository root:

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173`.

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Playwright tests use an installed Google Chrome. See [frontend documentation](docs/FRONTEND_GUIDE.md) for architecture, routes, pricing assumptions, privacy boundaries and browser setup, and the [initial verification report](docs/VERIFICATION.md) for executed checks.

## Local review setup

The local review uses frontend `http://localhost:5173`, backend `http://localhost:8010/docs`, and PostgreSQL on `127.0.0.1:5440` because the default backend/database ports are occupied by another project. Port overrides belong in the ignored root `.env`:

```dotenv
API_PORT=8010
POSTGRES_PORT=5440
TEST_POSTGRES_PORT=5434
```

When running Python outside Docker, update the host port in `DATABASE_URL` and `TEST_DATABASE_URL` to match. Docker Compose uses service names internally and keeps port 5432 inside the database containers. The API is bound to loopback for local development.

On the configured local checkout, start both parts with:

```sh
docker compose up -d --wait db api
npm run dev
```

On a first setup, follow the backend guide to build the image, apply migrations and seed the empty catalog before starting the API. The seed command intentionally refuses a nonempty catalog; do not rerun it on every startup.

Run the live HTTP check against the local API:

```sh
npm run check:api -- http://127.0.0.1:8010
```

This check creates a fictional local account, creates and cancels a reservation, and verifies authentication, permissions, availability, recommendations and CORS. Credentials remain in process memory. It refuses remote hosts to avoid test writes to a deployed service. It tests the API directly; it does not imply frontend/backend integration. See [the local review](docs/LOCAL_REVIEW.md) for findings.

## Backend

Student 2’s FastAPI/PostgreSQL implementation, database migrations, tests, Docker Compose, CI and deployment configuration are preserved in this repository.

Follow [backend setup and testing](docs/BACKEND.md) for secrets, database startup, migrations, catalog seeding and administrator creation. No real secret or administrator password is included. Backend services are started separately; `npm run dev` starts only the frontend.

- [Backend API handoff](docs/frontend.md)
- [Backend architecture and pricing rules](docs/architecture.md)
- [Backend demonstration scenario](docs/demo.md)

The backend deployment blueprint describes paid resources. Synchronizing this repository does not create or deploy those resources.

## Integration status

**The frontend currently uses its local mock services and is not connected to the backend.** Pulling both projects into one repository does not change that behavior. No real payments are implemented.

The existing backend’s local base URL is `http://localhost:8000/api/v1`. Its actual contract is documented in [docs/frontend.md](docs/frontend.md) and generated OpenAPI. The original [frontend API proposal](docs/API_CONTRACT.md) is retained as a proposal; it differs from the implemented backend. Integration must reconcile authentication, field names, timestamps, pricing and booking statuses through `src/services` before switching the UI to real requests.

The frontend currently uses `VITE_API_BASE_URL` as a future adapter placeholder. The backend handoff uses `VITE_API_URL`; neither setting alone connects the current mock UI. Credentials must stay out of source control and browser localStorage.

## Repository structure

```text
src/                 Frontend pages, components, state, services and tests
public/              Locally stored frontend images and favicon
e2e/                 Playwright frontend tests
backend/             Student 2’s API, migrations, Python tests and lockfile
.github/workflows/   Backend continuous integration
compose.yaml         Backend development and test services
render.yaml          Backend deployment blueprint
.env.example         Combined public frontend settings and backend placeholders
docs/                Setup, architecture, API handoff, design and verification
```

## Documentation

- [Frontend guide](docs/FRONTEND_GUIDE.md)
- [Backend guide](docs/BACKEND.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Image sources and licenses](docs/ASSETS.md)
- [Future coding-agent instructions](AGENTS.md)

Use `git pull --ff-only` to receive changes from the configured upstream. Commit intentional changes before pushing; do not force-push over another student’s work.
