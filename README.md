# DriveRent

A polished, responsive frontend for **A Smart Platform for Short-Term and Long-Term Car Rental**, a university Final Project by **Razyyev Ibrakhim (24B030181)** and a second student responsible for backend development.

DriveRent is an English-language demonstration marketplace for Almaty, Kazakhstan, with fictional KZT pricing. It has no real rental inventory, authentication, payments, or backend.

## Run locally

Use Node.js **26** (verified with 26.13.0) and npm (verified with 11.20.0). Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally http://localhost:5173. The development server binds to all interfaces to support device previews; use `npm run dev -- --host 127.0.0.1` for loopback only.

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run preview
```

Browser tests use an installed Google Chrome via Playwright’s `channel: 'chrome'`. Install Chrome if absent, or change the channel and run `npx playwright install chromium` to use Playwright Chromium. No browser download was necessary in the verified environment.

## Features and routes

| Route              | Implemented behavior                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Photo-led home, short/long-term date search, location and class selection, featured fleet, categories, benefits, process                    |
| `/cars`            | Text, brand, class, price, transmission, fuel, availability and selected-period filtering; sorting; results count; reset and mobile filters |
| `/cars/:id`        | Two-image illustrative gallery, specs, features, demo conditions, live pricing, availability and similar cars                               |
| `/booking/:carId`  | Customer validation, pickup/return dates and times, location, terms, pricing breakdown and confirmation                                     |
| `/login`           | Demo sign-in, validation, password visibility, guest demo entry                                                                             |
| `/register`        | Demo profile creation and validation                                                                                                        |
| `/dashboard`       | In-memory profile, upcoming/active/previous reservations, details, cancellation and empty states                                            |
| `/recommendations` | Deterministic budget, duration, capacity, class, transmission and trip-purpose matching with explanations                                   |
| `/admin`           | Overview, fleet/booking tables, derived analytics, create/edit/delete cars, availability toggles and legal status changes                   |

Unknown routes and vehicle IDs show a recovery state. There are 12 vehicle records in `src/data/cars.ts`. Photography is illustrative and can depict a different model or trim; see `docs/ASSETS.md`.

## Stack and architecture

React 19, strict TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Lucide, Radix Dialog/Slot, class-variance-authority, clsx and tailwind-merge. The local Button and Dialog primitives follow the shadcn composition approach and are styled for DriveRent. No shadcn generator, payment service, external auth provider or motion library is needed.

```text
src/
  components/       Reusable layout, cards, dates, pricing, search, states
    ui/             Accessible button and Radix dialog primitives
  context/          Demo state and mutation boundary
  data/             Initial vehicle records
  pages/            Route-level customer and admin interfaces
  services/         Cars, bookings, auth, recommendations, future HTTP client
  types/            Shared domain contracts
  utils/            Pricing, dates, validation, overlap/status rules
  tests/            Vitest domain tests
  styles.css        Tokens, components, responsive layouts, reduced motion
public/images/      Optimized local assets; no runtime image host dependency
e2e/                Playwright customer/admin and responsive checks
docs/               API proposal, design system, assets, verification report
```

## Pricing assumptions

All amounts are fictional KZT estimates. Every vehicle currently has a 20% long-term discount.

- Up to and including 6 hours: each **started hour** costs one sixth of the daily rate.
- More than 6 hours: each **started 24-hour period** costs one daily rate.
- A rental of at least **720 elapsed hours (30 full days)** receives 20% off its entire base price. A partly used 30th day does not qualify.
- Totals and discounts are rounded to whole tenge. No taxes, payment fees, deposit, or extra charges are modeled.
- Times use the browser’s local timezone. The future backend must normalize to Asia/Almaty and exchange timestamps with explicit offsets. For this Almaty demonstration, run the browser in Asia/Almaty.
- Pickup must be in the future and return after pickup. Existing non-cancelled overlapping intervals block another reservation. Adjacent return/pickup boundaries are permitted.
- The admin state machine is Upcoming → Active → Completed or Upcoming → Cancelled. Closed bookings cannot reopen. Only upcoming bookings can be customer-cancelled.

## Demo data and privacy boundaries

Bookings and admin fleet changes persist in this browser using versioned localStorage keys. Booking records contain only random ID, vehicle ID, rental dates, location, estimate and status. Names, emails and passwords are never written to storage. Profiles exist only in React memory and reset on reload. Demo auth accepts any syntactically valid fictional inputs and does not verify credentials.

Customer and admin pages share one local demo workspace; they are **not account-isolated or secured**. Admin is intentionally accessible for presentation. Empty history is intentional before the first booking. Dates/statuses are manually maintained, not automatically advanced by a background job. Multi-tab concurrency, tampered storage and distributed locking need a backend; demo overlap checks are not a replacement for server transactions. Clear this origin’s localStorage in browser developer tools to reset the demo fleet/history.

## Backend integration

`docs/API_CONTRACT.md` proposes contracts for agreement with Student 2; **these endpoints do not exist yet**. `src/services/api.ts` is an unused typed HTTP adapter. The current mock implementations do not call it; changing the environment placeholder alone does not enable a backend.

Replace the service implementations and context mutations with async API operations; retain the shared domain types and route interfaces. Add per-request loading/error states, server-authoritative prices, transactional availability checks, session-cookie authentication, account-scoped bookings and server-enforced admin roles. Do not trust frontend validation or route controls as security.

`.env.example` contains public placeholders only. Never put secrets in `VITE_` values; they are included in browser bundles. The mock flag documents the intended integration switch and is not currently a runtime switch.

## Ownership

**Student 1 — Razyyev Ibrakhim:** frontend, UI/UX, responsive layouts, client interactions, frontend testing, integration preparation.

**Student 2:** backend, database, actual authentication, booking API, business logic, transactional availability, and the real recommendation algorithm.

## Repository

The supplied GitHub repository was empty when checked. The project is initialized on `main`, with origin `https://github.com/ibra-0/car_rental_smart_platform.git`. Nothing is pushed automatically. See `docs/VERIFICATION.md` for actual validation and Git limitations.

To create the initial commit once an author is configured, using your own details:

```sh
git config user.name "YOUR NAME"
git config user.email "YOUR GITHUB EMAIL"
git add .
git commit -m "Build DriveRent rental marketplace frontend"
```

If and when you choose to publish to GitHub:

```sh
git push -u origin main
```
