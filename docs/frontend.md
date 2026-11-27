# Frontend API contract

Local API: `http://localhost:8000/api/v1`. The interactive contract is at `/docs`;
the machine-readable schema is at `/openapi.json`.

## Authentication

`POST /auth/register`:

```json
{"name": "Alex", "email": "alex@example.com", "password": "a strong password"}
```

Returns the user with `201`. `POST /auth/login` accepts `email` and `password` as JSON:

```json
{"access_token": "...", "token_type": "bearer", "expires_in": 3600}
```

Send `Authorization: Bearer <access_token>` for protected requests. `GET /auth/me` returns
`id`, `name`, `email`, `role`, `created_at`. After a `401`, clear the token and ask the user
to log in again. The role is `user` or `admin`; hiding admin controls does not replace server authorization.
Keep the token in React memory for the MVP and ask for login after a page reload.

## Catalog

`GET /cars` is public. Query parameters:

| Parameter | Meaning |
| --- | --- |
| `q` | Case-insensitive text search in brand/model |
| `brand` | Exact brand, case-insensitive |
| `car_class` | `economy`, `comfort`, `suv` |
| `min_price`, `max_price` | Inclusive daily-price bounds in whole KZT |
| `sort` | `price_asc` (default), `price_desc` |
| `starts_at`, `ends_at` | Optional availability period; supply both |
| `limit`, `offset` | Default 20/0, maximum limit 100 |

All paginated endpoints return `{ "items": [...], "total": 12, "limit": 20, "offset": 0 }`.
`GET /cars/{id}` returns an active car. Fields: `id`, `brand`, `model`, `year`, `car_class`,
`transmission` (`automatic`/`manual`), `seats`, `description`, `image_url`, `hourly_price`,
`daily_price`, `is_active`. Each ID identifies a physical vehicle.

Use `URLSearchParams` for query strings so `+05:00` is encoded correctly.

## Quote and booking

`POST /bookings/quote` (public) and `POST /bookings` (authenticated) accept the same body:

```json
{
  "car_id": 1,
  "starts_at": "2030-01-01T10:00:00+05:00",
  "ends_at": "2030-01-02T12:00:00+05:00"
}
```

Start must be in the future. Datetimes must include an offset or `Z`. Display them in
`Asia/Almaty`; do not send local timestamps without a timezone.

At 2,000 KZT/hour and 20,000 KZT/day the quote contains:

```json
{
  "car_id": 1,
  "starts_at": "2030-01-01T10:00:00+05:00",
  "ends_at": "2030-01-02T12:00:00+05:00",
  "billed_hours": 26,
  "hourly_price": 2000,
  "daily_price": 20000,
  "subtotal": 24000,
  "discount_percent": 0,
  "total_price": 24000,
  "currency": "KZT"
}
```

Creation returns `201` and adds `id`, `user_id`, `status: "pending"`, `created_at`,
and the nested `car`. It rechecks availability and recalculates using current rates;
a quote does not reserve the vehicle or lock the price. Show the returned booking price.
Prices at the top level are the saved booking snapshot; nested `car` describes the current car.

`GET /bookings` lists only the authenticated user's bookings. `GET /bookings/{id}`
returns one owned booking. `POST /bookings/{id}/cancel` cancels an owned pending or
confirmed booking before its start. Cancellation returns the updated booking.

Poll the user's booking list when needed or add a Refresh button. No WebSocket is required.

## Recommendations

`POST /recommendations` is public:

```json
{
  "starts_at": "2030-01-01T10:00:00+05:00",
  "ends_at": "2030-01-08T10:00:00+05:00",
  "daily_budget": 25000,
  "preferred_class": "comfort"
}
```

Returns an array of up to five `{car, quote, reasons}` objects. Budget filters the
advertised daily rate before discounts. Preferred-class matches come first, then lower
total rental prices, then car ID for consistent ordering. Other classes remain eligible.
`reasons` contains readable English explanations. An empty array means no matches.

## Administration

Every `/admin` endpoint requires an administrator token.

| Method / path | Behavior |
| --- | --- |
| `GET /admin/cars` | All cars including inactive; `limit`, `offset` |
| `POST /admin/cars` | Create a car using catalog fields except `id`; `is_active` defaults to true |
| `PATCH /admin/cars/{id}` | Update supplied fields only; explicit null is rejected |
| `GET /admin/bookings` | All bookings; optional `status`, `limit`, `offset`; includes nested `user` and `car` |
| `PATCH /admin/bookings/{id}/status` | Body: `{"status": "confirmed"}` |
| `GET /admin/stats` | Counts and completed-rental value |

Allowed admin transitions: `pending -> confirmed/rejected`, `confirmed -> cancelled/completed`.
Completion requires the rental end to have passed. Terminal statuses cannot be reopened.
Pending and confirmed bookings occupy the car; pending bookings do not expire automatically.

Statistics: `total_cars`, `active_cars`, `pending_bookings`, `bookings_by_status`
(all five statuses, including zero counts), `completed_rental_value`, `currency`.
Label the monetary metric **Completed rental value**, since there are no real payments.

## Errors

| Status | UI behavior |
| --- | --- |
| `401` | Ask for login |
| `403` | Show access denied |
| `404` | Resource does not exist or is not accessible to this user |
| `409` | Show conflict; refresh availability/status before trying again |
| `422` | Show field/date validation errors |
| `503` on `/health` | Database unavailable |

Business errors use `{"detail": "..."}`. Validation errors use FastAPI's standard
`{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}`. Extra request fields are
rejected on write endpoints; never send client-calculated prices, role, or user ID.
