# DriveRent agent instructions

## Project and ownership

This is Student 1’s university frontend for DriveRent. Student: Razyyev Ibrakhim, 24B030181. Use React, strict TypeScript, Vite and the existing component tokens. The target audience is car renters in Almaty; UI is English and prices are KZT.

Student 2 owns backend, database, real authentication, business logic, booking API and actual recommendation algorithm. The existing `backend/` and its CI/deployment files are Student 2’s work, received through Git synchronization; preserve them. Do not implement or modify backend behavior, add a payment provider, expose API keys or create fake real authentication without an explicit new request.

## Architecture

- Domain types belong in `src/types`, seed records in `src/data`, domain rules in `src/utils` and data operations in `src/services`.
- Components consume the shared state/service boundary. Keep pricing, overlap prevention, recommendation scoring and status transitions out of page markup.
- Prefer reusable components and bounded page modules. Avoid duplicated rules and avoid `any`.
- The demo is synchronous; switching to real services requires async loading/error UI and account isolation, not merely changing an env value.
- Keep passwords, tokens, names, emails and identity documents out of localStorage, logs, fixtures and committed artifacts. Use fictional inputs in tests. Persist only demo booking metadata and fleet/UI state.
- Validate rental dates and enforce demo overlap rules at mutation time. Server implementation must remain authoritative when integrated.

## Design

Follow `docs/DESIGN_SYSTEM.md`. Use the existing light neutral surfaces, charcoal text and orange action color. Use local, licensed photography and document additions in `docs/ASSETS.md`. Vehicle imagery is illustrative; never imply exact trim accuracy. Avoid fake testimonials/statistics, excessive motion, gradients used as decoration and emoji icons. Maintain clear demo notices without burdening ordinary flows with implementation details.

Use semantic forms and visible labels, keyboard focus, accessible Radix dialogs, responsive navigation and reduced-motion support. Verify 375, 390, 768, 1024, 1440 and 1920 pixel widths. Keep tables locally scrollable instead of overflowing the page.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` after meaningful changes. Use `npm run test:e2e` for affected booking, catalog, auth/admin or layout flows. Chrome must be installed. Add meaningful tests for modified business rules; do not add tests that just mirror markup.

Inspect real desktop/mobile screenshots for layout changes. Do not claim checks passed without running them. Preserve user work. Do not force-push or push without explicit permission. Do not invent a Git author identity.
