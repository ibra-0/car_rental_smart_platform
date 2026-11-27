from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta, timezone
from threading import Barrier

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.bookings.models import Booking


def test_quote_creation_snapshot_and_ownership(client, user_headers, admin_headers, car, rental):
    quote = client.post("/api/v1/bookings/quote", json=rental)
    assert quote.status_code == 200, quote.text
    assert quote.json()["total_price"] == 24000
    assert client.post("/api/v1/bookings", json=rental).status_code == 401
    response = client.post("/api/v1/bookings", headers=user_headers, json=rental)
    assert response.status_code == 201, response.text
    booking = response.json()
    assert booking["status"] == "pending"
    assert booking["total_price"] == 24000
    assert booking["car"]["id"] == car["id"]
    assert client.get("/api/v1/bookings", headers=user_headers).json()["total"] == 1
    assert client.get("/api/v1/bookings", headers=admin_headers).json()["total"] == 0
    assert client.get(f"/api/v1/bookings/{booking['id']}", headers=admin_headers).status_code == 404
    client.patch(
        f"/api/v1/admin/cars/{car['id']}",
        headers=admin_headers,
        json={"daily_price": 50000, "hourly_price": 5000},
    )
    saved = client.get(f"/api/v1/bookings/{booking['id']}", headers=user_headers).json()
    assert saved["total_price"] == 24000
    assert saved["daily_price"] == 20000


def test_create_recalculates_quote(client, user_headers, admin_headers, car, rental):
    assert client.post("/api/v1/bookings/quote", json=rental).json()["total_price"] == 24000
    client.patch(
        f"/api/v1/admin/cars/{car['id']}", headers=admin_headers, json={"hourly_price": 3000}
    )
    response = client.post("/api/v1/bookings", headers=user_headers, json=rental)
    assert response.json()["total_price"] == 26000


def test_overlap_and_adjacent_intervals(client, user_headers, rental, booking):
    assert client.post("/api/v1/bookings", headers=user_headers, json=rental).status_code == 409
    assert client.post("/api/v1/bookings/quote", json=rental).status_code == 409
    filters = {k: v for k, v in rental.items() if k != "car_id"}
    assert client.get("/api/v1/cars", params=filters).json()["total"] == 0
    adjacent = {
        **rental,
        "starts_at": rental["ends_at"],
        "ends_at": (datetime.fromisoformat(rental["ends_at"]) + timedelta(hours=1)).isoformat(),
    }
    assert client.post("/api/v1/bookings", headers=user_headers, json=adjacent).status_code == 201


def test_postgresql_constraint_rejects_overlap_even_without_api(engine, booking):
    values = {
        k: booking[k]
        for k in [
            "user_id",
            "car_id",
            "billed_hours",
            "hourly_price",
            "daily_price",
            "subtotal",
            "discount_percent",
            "total_price",
        ]
    }
    values.update(
        starts_at=datetime.fromisoformat(booking["starts_at"]),
        ends_at=datetime.fromisoformat(booking["ends_at"]),
    )
    with Session(engine) as db:
        db.add(Booking(**values))
        with pytest.raises(IntegrityError) as error:
            db.commit()
        assert error.value.orig.sqlstate == "23P01"
        assert error.value.orig.diag.constraint_name == "bookings_no_overlap"
        db.rollback()


def test_concurrent_requests_book_only_once(client, user_headers, rental):
    barrier = Barrier(2)

    def submit():
        barrier.wait(timeout=10)
        return client.post("/api/v1/bookings", headers=user_headers, json=rental).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: submit(), range(2)))
    assert sorted(results) == [201, 409]
    assert client.get("/api/v1/bookings", headers=user_headers).json()["total"] == 1


def test_invalid_dates_and_untrusted_fields(client, user_headers, rental):
    past = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    cases = [
        {**rental, "starts_at": past},
        {**rental, "ends_at": rental["starts_at"]},
        {**rental, "starts_at": "2030-01-01T12:00:00"},
        {**rental, "user_id": 999},
        {**rental, "status": "confirmed"},
        {**rental, "total_price": 1},
    ]
    for data in cases:
        response = client.post("/api/v1/bookings", headers=user_headers, json=data)
        assert response.status_code == 422, response.text
    assert client.get("/api/v1/cars", params={"starts_at": rental["starts_at"]}).status_code == 422


def test_inactive_car_cannot_be_quoted_or_booked(client, user_headers, admin_headers, car, rental):
    client.patch(
        f"/api/v1/admin/cars/{car['id']}", headers=admin_headers, json={"is_active": False}
    )
    assert client.post("/api/v1/bookings/quote", json=rental).status_code == 404
    assert client.post("/api/v1/bookings", headers=user_headers, json=rental).status_code == 404


def test_equivalent_timezones_have_same_price(client, rental):
    original = client.post("/api/v1/bookings/quote", json=rental).json()
    offset = {
        **rental,
        "starts_at": datetime.fromisoformat(rental["starts_at"])
        .astimezone(timezone(timedelta(hours=5)))
        .isoformat(),
    }
    assert (
        client.post("/api/v1/bookings/quote", json=offset).json()["total_price"]
        == original["total_price"]
    )
