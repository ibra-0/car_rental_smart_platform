# Local full-project review — 27 November 2026

Both services were started and verified locally. **They are running side by side; the UI still uses mock services and is not integrated with the API.** This review does not claim a real browser-to-database booking flow.

## Running services

| Component              | Local address              | Verified state                                                        |
| ---------------------- | -------------------------- | --------------------------------------------------------------------- |
| React/Vite frontend    | http://localhost:5173      | HTTP preview running; customer/admin demo journeys tested in Chrome   |
| FastAPI backend        | http://localhost:8010/docs | Container healthy; Swagger/OpenAPI and live HTTP operations available |
| Development PostgreSQL | 127.0.0.1:5440             | Dedicated Docker volume; migrations applied; 12 demo cars seeded      |

Ports 8000 and 5433 belong to an unrelated local project, so they were preserved. Docker Compose host ports are now configurable through `API_PORT`, `POSTGRES_PORT`, and `TEST_POSTGRES_PORT`. The API’s local host binding is loopback. `.env` was generated with random secrets, permission 0600, and remains ignored. No system Python installation was changed: the API runs with Python 3.12 in Docker because the system Python is 3.9 and uv is not installed globally.

## Confirmed findings and priorities

| Priority | Finding                                           | Evidence and next change                                                                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First    | Frontend and backend are not connected            | UI reads local mock state; the inspected catalog made no `/api/` requests. Add an explicit API mode with async loading/error states and replace the service/context operations. Preserve the demo as a separately labelled mode.                                                                                            |
| First    | Different vehicle IDs and fields                  | Mock `id=1` is Toyota Camry; backend `id=1` is Hyundai Accent, and backend Camry has another ID. Use records returned by the server and a typed DTO mapper; never reuse mock IDs to create API bookings.                                                                                                                    |
| First    | Different pricing policies                        | Verified backend Camry quote for 26 hours: **30,000 ₸**; frontend mock charges two full days: **50,000 ₸**. Backend also applies 10% at 7+ days; mock only applies 20% at 30+ days. The connected UI must display the backend quote and final booking snapshot.                                                             |
| First    | Authentication and roles differ                   | UI sign-in is intentionally a demo and the demo admin is public. Backend uses a Bearer JWT with server-enforced user/admin permissions. Add token handling in React memory, account-scoped history, 401/403 states and role-aware navigation before enabling live mutations. Do not store tokens/passwords in localStorage. |
| Next     | Booking lifecycle differs                         | UI uses Upcoming/Active/Completed/Cancelled; API uses pending/confirmed/rejected/cancelled/completed. Pending does not mean confirmed. Map statuses explicitly and show pending confirmation clearly; honor server cancellation and completion rules.                                                                       |
| Next     | Dates need explicit timezone conversion           | UI `datetime-local` values have no offset; API rejects naive timestamps. Convert according to Asia/Almaty and send offset-aware values. Verify from a browser in another timezone.                                                                                                                                          |
| Next     | Fleet capabilities and filters do not match       | Backend supports economy/comfort/suv, hourly rates, one image and active status. Mock UI adds Premium, fuel, feature lists and galleries. Agree actual supported fields and remove or explicitly label unsupported filters. Do not invent data in the adapter.                                                              |
| Next     | Shared launch workflow has manual first-run steps | Migrations and seed are explicit and seed refuses a nonempty database. Add a documented or scripted idempotent local setup, with service readiness and port-conflict detection. Do not rerun seed blindly.                                                                                                                  |
| Later    | Photography is illustrative                       | Some photos show another model. Replace them with model-specific, licensed fleet photos before a real presentation claiming exact inventory.                                                                                                                                                                                |
| Later    | Test-client deprecation warning                   | All backend tests pass, but Starlette warns about its current httpx TestClient integration. Coordinate a compatible test-tool update separately; no dependency upgrade was made during this review.                                                                                                                         |

## Fixes made during the review

- Configurable Compose host ports and loopback-only local API exposure; both projects can run without stopping unrelated services.
- Catalog filter state now lives in the URL. Brand/class/search/price/transmission/fuel/availability/sort survive reload and shared links. Same-route navigation uses the new query. Clearing rental dates preserves other filters.
- Added `aria-expanded`/`aria-controls` to the mobile catalog-filter toggle.
- Increased key search/filter labels, vehicle specs, operational statuses and table text to 14px; availability controls have a 44px touch target.
- Added `npm run check:api -- <local-origin>`, a dependency-free live API check. It refuses non-loopback hosts, keeps generated credentials in memory, and cancels its test booking. Its fictional account and cancelled booking remain in the local development database.
- Added unit tests for URL parsing/updating and a browser regression test for reload, clearing dates and long-term same-page navigation.

No backend business logic was changed. No application deployment or Git push is part of this review.

## Verification actually executed

| Check                                   | Result                                                                                                                                                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend ESLint                         | Passed                                                                                                                                                                                                                                         |
| Frontend TypeScript                     | Passed                                                                                                                                                                                                                                         |
| Frontend unit tests                     | **22 passed**                                                                                                                                                                                                                                  |
| Frontend production build               | Passed                                                                                                                                                                                                                                         |
| Chrome E2E tests                        | **5 passed**, final full run 45.5 seconds                                                                                                                                                                                                      |
| Responsive/browser checks               | All nine routes at 375, 390, 768, 1024, 1440 and 1920px; no document overflow or broken images                                                                                                                                                 |
| Backend Ruff                            | Passed                                                                                                                                                                                                                                         |
| Backend Ruff format                     | 43 files already formatted                                                                                                                                                                                                                     |
| Backend pytest with separate PostgreSQL | **47 passed** in 2.37 seconds, one dependency deprecation warning                                                                                                                                                                              |
| Live HTTP API check                     | **17 checks passed**: health, catalog, registration, sign-in, profile, user/admin boundaries, unauthenticated access, quote, booking, overlap conflict, history, availability exclusion, cancellation, invalid dates, recommendations and CORS |

The first attempt to run backend tests in the production image found no tests because `backend/.dockerignore` intentionally excludes them. This was not counted as a pass. A separate check container mounted the repository’s tests read-only and used the dedicated `driverent_test` database; its full suite passed. No tests were pointed at the development database or any other project’s database.

Screenshots in `docs/review/` were captured and visually inspected after the UI fixes. Browser checks use Chrome, not a full Safari/Firefox or assistive-technology audit.

## Repeat locally

With the generated local `.env` and initialized database:

```sh
docker compose up -d --wait db api
npm run dev
npm run check:api -- http://127.0.0.1:8010
```

Frontend checks:

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Backend checks can run without installing system uv/Python. From the repository root, start the separate test database and mount only test sources into the check container:

```sh
docker compose --profile test up -d --wait test-db
docker compose run --rm --no-deps \
  --volume "$PWD/backend/tests:/app/tests:ro" \
  --volume driverent_uv_cache:/root/.cache/uv \
  -e UV_LINK_MODE=copy \
  -e TEST_DATABASE_URL=postgresql+psycopg://driverent:test-password@test-db:5432/driverent_test \
  api sh -c 'uv sync --frozen && .venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/pytest -q'
docker compose --profile test stop test-db
```

Frontend and API are intentionally left running for the requested hands-on review. Stop frontend with Ctrl+C in its terminal; stop the DriveRent containers with `docker compose stop api db`. This keeps the development database volume.
