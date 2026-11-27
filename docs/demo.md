# Defense demonstration

## Before the presentation

1. Start the application and PostgreSQL using the README instructions.
2. Apply migrations, create an administrator and seed the 12-car catalog.
3. Connect the React frontend to `/api/v1` and add its origin to `CORS_ORIGINS`.
4. Open `/docs` as a backup interface for demonstrating the API.

## Main scenario

1. Register a normal user and log in.
2. Choose future dates and a car from the available catalog.
3. Show the breakdown for 26 hours: one full day and two extra hours.
4. Create the booking; show `pending` in My bookings.
5. Log in as administrator in a separate browser session and confirm the order.
6. Refresh My bookings; show `confirmed`.
7. Try to reserve the same car for overlapping dates: it disappears from availability,
   and direct booking attempts return 409.
8. Show recommendations for a budget and preferred class, including explanations and
   the discount for a 30-day period.

## Repeatable HTTP verification

With a seeded catalog and an existing administrator, run from `backend/`:

```sh
export ADMIN_EMAIL=admin@example.com
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
uv run python scripts/smoke.py --base-url http://localhost:8000
unset ADMIN_PASSWORD
```

The script uses real HTTP requests and prints PASS only after the owner sees a confirmed
booking. It creates a new demo user and leaves a confirmed booking for inspection.
It can also target the deployed HTTPS URL.
