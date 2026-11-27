# Proposed DriveRent API contract

**Historical frontend proposal for discussion with Student 2. These proposed contracts are not implemented by the frontend.**

The repository now includes Student 2’s backend. See [the actual backend handoff](frontend.md) and its generated OpenAPI for implemented endpoints. This proposal is retained for comparison and must not be treated as the backend specification. The UI remains in mock mode. Student 1 owns the frontend; Student 2 owns persistence, authentication, pricing authority, inventory locks and recommendation implementation.

## Shared conventions

Base URL: `/api`. JSON request/response bodies. Amounts are integer KZT. IDs are opaque strings. Backend timestamps must use ISO 8601 with explicit offsets or UTC; normalize rental operations to `Asia/Almaty`. The current mock uses browser-local `datetime-local` strings; map these explicitly at the integration boundary.

Proposed success envelope: raw resource object, or `{items: T[], total: number, page: number, pageSize: number}` for collections. Proposed error: `{error:{code:string,message:string,fields?:Record<string,string>,requestId?:string}}`. Use 400 for validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 booking/availability conflicts, 422 invalid business transitions and 429 rate limits. The adapter should translate errors to useful inline messages; do not expose stack traces.

Pagination: page/pageSize; server validation required. Filters and sorting must be server-side for a production fleet.

## Models

```ts
interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: "Economy" | "Comfort" | "SUV" | "Premium";
  description: string;
  transmission: "Automatic" | "Manual";
  fuel: "Petrol" | "Diesel" | "Hybrid";
  passengers: number;
  dailyPrice: number;
  monthlyDiscount: number;
  images: string[];
  available: boolean;
  features: string[];
}
interface RentalPeriod {
  start: string;
  end: string;
}
interface User {
  id: string;
  name: string;
  email: string;
}
type BookingStatus = "Upcoming" | "Active" | "Completed" | "Cancelled";
interface Booking extends RentalPeriod {
  id: string;
  carId: string;
  total: number;
  status: BookingStatus;
  location: string;
}
```

The server may extend booking responses with a safe `carSnapshot`, quote breakdown and audit timestamps. Users must never receive another user’s bookings or profile. The local demo currently has no account isolation.

## Cars and availability

| Method | Endpoint                 | Request                                                                                                     | Response                                                                                                                  |
| ------ | ------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/cars`                  | Query: query, brand, category, maxPrice, transmission, fuel, availability, sort, start, end, page, pageSize | Paginated Car collection                                                                                                  |
| GET    | `/cars/:id`              | ID                                                                                                          | Car or 404                                                                                                                |
| GET    | `/cars/:id/availability` | Query: start, end                                                                                           | `{available:boolean, reason?:string, quote?:{base:number,discount:number,total:number,currency:'KZT'},expiresAt?:string}` |

Availability must check operating status plus overlapping intervals. Do not expose other customers’ identity or complete booking records in availability responses.

## Authentication

| Method | Endpoint         | Request                 | Response                        |
| ------ | ---------------- | ----------------------- | ------------------------------- |
| POST   | `/auth/register` | `{name,email,password}` | 201 User, secure session cookie |
| POST   | `/auth/login`    | `{email,password}`      | User, secure session cookie     |
| POST   | `/auth/logout`   | Empty                   | 204, invalidate cookie          |
| GET    | `/auth/me`       | Session cookie          | User or 401                     |

Prefer HttpOnly, Secure, SameSite cookies. Agree CSRF protection and CORS policy. Never return password hashes or put access tokens in browser localStorage. Server must hash passwords, rate-limit sign-in, enforce roles and validate data. Current demo sign-in is unrelated to secure auth and must be replaced.

## Bookings

| Method | Endpoint               | Request                                                                | Response                            |
| ------ | ---------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| GET    | `/bookings`            | Authenticated session; optional status/page                            | Current user’s bookings             |
| POST   | `/bookings`            | `{carId,start,end,location,termsVersion}` and `Idempotency-Key` header | 201 authoritative Booking and quote |
| GET    | `/bookings/:id`        | Booking ID, ownership check                                            | Booking                             |
| PATCH  | `/bookings/:id/cancel` | `{reason?:string}`                                                     | Updated Booking                     |

Frontend must not submit a trusted total or user ID. Server derives user from session, recomputes price, checks eligibility, atomically prevents overlaps, and returns 409 if inventory changed. Agree lead times, minimum duration, time zone, cancellation policy, mileage rules, deposits, and insurance with the team. Customer may cancel Upcoming only under the current demo assumption.

## Recommendations

`POST /recommendations`

```json
{
  "budget": 35000,
  "budgetType": "daily",
  "days": 3,
  "passengers": 2,
  "category": "",
  "transmission": "Automatic",
  "purpose": "City driving"
}
```

Proposed response: `{items:[{car:Car,score:number,reasons:string[]}],algorithmVersion:string}`. Budget type is `daily|total`; empty preference means no preference. Purposes: City driving, Business trip, Family travel, Long-distance travel, Premium experience. Server validates bounds and prices. Mock scoring is deterministic and is not a trained AI model. The actual algorithm belongs to Student 2.

## Administration

All endpoints require server-enforced admin authorization; frontend visibility is not security.

| Method | Endpoint                     | Request                                            | Response                           |
| ------ | ---------------------------- | -------------------------------------------------- | ---------------------------------- |
| GET    | `/admin/cars`                | Pagination/filter query                            | Paginated Car collection           |
| POST   | `/admin/cars`                | Car fields without ID                              | 201 Car                            |
| PATCH  | `/admin/cars/:id`            | Mutable car fields; optimistic version recommended | Updated Car                        |
| DELETE | `/admin/cars/:id`            | ID                                                 | 204; 409 with open reservations    |
| GET    | `/admin/bookings`            | Pagination/status query                            | Paginated admin booking collection |
| PATCH  | `/admin/bookings/:id/status` | `{status,version?}`                                | Updated Booking                    |

Current state transitions: Upcoming → Active/Cancelled; Active → Completed; closed states cannot reopen. Agree automatic activation/completion and administrative exceptions with Student 2. Consider soft deletion, audit logs, image uploads and reservation snapshots to preserve history.

## Integration checklist

1. Agree these contracts, pricing/eligibility assumptions, time zones and error codes with Student 2.
2. Replace synchronous mock service/context operations with the typed HTTP adapter; implement async loading/error/retry states and server validation feedback.
3. Map local date/time controls to offset-aware timestamps and server quotes.
4. Implement session lifecycle, account-scoped history, ownership and admin permissions on the server.
5. Add atomic inventory locking and idempotency for booking creation.
6. Replace the recommendation service behind its existing interface.
7. Add contract tests and integration E2E tests against a test backend. Do not ship the local mock admin as production security.
