import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const origin = process.argv[2] || "http://127.0.0.1:8000";
const base = new URL(origin);
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) {
  throw new Error(
    "This check creates fictional users/bookings. Use a local development API.",
  );
}
let checks = 0;
async function request(
  path,
  { method = "GET", body, token, status = 200, headers = {} } = {},
) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(
    response.status,
    status,
    `${method} ${path}: expected ${status}, received ${response.status}`,
  );
  checks++;
  return response.status === 204 ? null : response.json();
}

await request("/health");
const catalog = await request("/api/v1/cars?limit=100");
assert(
  catalog.items.length > 0,
  "Seed the catalog before running the API check.",
);
const car = catalog.items.find((c) => c.model === "Camry") || catalog.items[0];
const email = `review-${randomUUID()}@example.com`;
const password = randomUUID() + randomUUID();
await request("/api/v1/auth/register", {
  method: "POST",
  body: { name: "Local review driver", email, password },
  status: 201,
});
const { access_token: token } = await request("/api/v1/auth/login", {
  method: "POST",
  body: { email, password },
});
await request("/api/v1/auth/me", { token });
await request("/api/v1/admin/bookings", { token, status: 403 });
await request("/api/v1/bookings", { status: 401 });

const start = new Date(Date.now() + 10 * 86400000);
const end = new Date(start.getTime() + 26 * 3600000);
const rental = {
  car_id: car.id,
  starts_at: start.toISOString(),
  ends_at: end.toISOString(),
};
const quote = await request("/api/v1/bookings/quote", {
  method: "POST",
  body: rental,
});
assert(quote.total_price > 0 && Number.isInteger(quote.total_price));
let booking;
try {
  booking = await request("/api/v1/bookings", {
    method: "POST",
    body: rental,
    token,
    status: 201,
  });
  assert.equal(booking.total_price, quote.total_price);
  assert.equal(booking.status, "pending");
  await request("/api/v1/bookings", {
    method: "POST",
    body: rental,
    token,
    status: 409,
  });
  const history = await request("/api/v1/bookings", { token });
  assert(history.items.some((b) => b.id === booking.id));
  const available = await request(
    "/api/v1/cars?" +
      new URLSearchParams({
        starts_at: rental.starts_at,
        ends_at: rental.ends_at,
        limit: "100",
      }),
  );
  assert(
    !available.items.some((c) => c.id === car.id),
    "Booked vehicle must leave the available catalog.",
  );
} finally {
  if (booking) {
    const cancelled = await request(`/api/v1/bookings/${booking.id}/cancel`, {
      method: "POST",
      token,
    });
    assert.equal(cancelled.status, "cancelled");
  }
}
await request("/api/v1/bookings/quote", {
  method: "POST",
  body: { ...rental, ends_at: rental.starts_at },
  status: 422,
});
const matches = await request("/api/v1/recommendations", {
  method: "POST",
  body: {
    starts_at: rental.starts_at,
    ends_at: rental.ends_at,
    daily_budget: 70000,
    preferred_class: "comfort",
  },
});
assert(Array.isArray(matches) && matches.length > 0);
for (const origin of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
  const preflight = await fetch(new URL("/api/v1/cars", base), {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  assert.equal(preflight.status, 200);
  checks++;
}
console.log(
  `PASS: ${checks} live API checks — auth, permissions, quote, booking, overlap prevention, history, cancellation, recommendations and CORS.`,
);
console.log(
  `${car.brand} ${car.model}, 26 hours: ${quote.total_price} KZT. Test booking cancelled; fictional account remains in the local database.`,
);
