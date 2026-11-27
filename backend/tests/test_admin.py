from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from threading import Barrier

import pytest
from sqlalchemy import update

from app.bookings.models import Booking


def set_past_rental(engine, booking_id):
    end = datetime.now(UTC) - timedelta(days=1)
    with engine.begin() as connection:
        connection.execute(
            update(Booking)
            .where(Booking.id == booking_id)
            .values(starts_at=end - timedelta(hours=26), ends_at=end)
        )


def test_confirmation_is_visible_to_owner(client, admin_headers, user_headers, booking):
    url = f"/api/v1/admin/bookings/{booking['id']}/status"
    assert client.patch(url, headers=user_headers, json={"status": "confirmed"}).status_code == 403
    response = client.patch(url, headers=admin_headers, json={"status": "confirmed"})
    assert response.status_code == 200, response.text
    assert response.json()["user"]["email"] == "user@example.com"
    response = client.get(f"/api/v1/bookings/{booking['id']}", headers=user_headers)
    assert response.json()["status"] == "confirmed"
    response = client.get(
        "/api/v1/admin/bookings", headers=admin_headers, params={"status": "confirmed", "limit": 1}
    )
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == booking["id"]
    assert client.get("/api/v1/admin/bookings", headers=user_headers).status_code == 403


@pytest.mark.parametrize("confirmed", [False, True])
def test_customer_cancel_frees_car(client, admin_headers, user_headers, rental, booking, confirmed):
    if confirmed:
        client.patch(
            f"/api/v1/admin/bookings/{booking['id']}/status",
            headers=admin_headers,
            json={"status": "confirmed"},
        )
    url = f"/api/v1/bookings/{booking['id']}/cancel"
    assert client.post(url, headers=admin_headers).status_code == 404
    response = client.post(url, headers=user_headers)
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "cancelled"
    assert client.post(url, headers=user_headers).status_code == 409
    assert client.post("/api/v1/bookings", headers=user_headers, json=rental).status_code == 201


def test_customer_cannot_cancel_started_rental(client, engine, user_headers, booking):
    with engine.begin() as connection:
        connection.execute(
            update(Booking)
            .where(Booking.id == booking["id"])
            .values(starts_at=datetime.now(UTC) - timedelta(hours=1))
        )
    assert (
        client.post(f"/api/v1/bookings/{booking['id']}/cancel", headers=user_headers).status_code
        == 409
    )


def test_rejection_frees_car_and_cannot_be_reversed(client, admin_headers, rental, booking):
    url = f"/api/v1/admin/bookings/{booking['id']}/status"
    response = client.patch(url, headers=admin_headers, json={"status": "rejected"})
    assert response.status_code == 200
    assert client.post("/api/v1/bookings/quote", json=rental).status_code == 200
    assert client.patch(url, headers=admin_headers, json={"status": "confirmed"}).status_code == 409


def test_completion_rules_and_snapshot_statistics(
    client, engine, admin_headers, user_headers, booking
):
    url = f"/api/v1/admin/bookings/{booking['id']}/status"
    assert client.patch(url, headers=admin_headers, json={"status": "completed"}).status_code == 409
    assert client.patch(url, headers=admin_headers, json={"status": "confirmed"}).status_code == 200
    assert client.patch(url, headers=admin_headers, json={"status": "completed"}).status_code == 409
    assert client.patch(url, headers=admin_headers, json={"status": "pending"}).status_code == 409
    set_past_rental(engine, booking["id"])
    assert client.patch(url, headers=admin_headers, json={"status": "completed"}).status_code == 200
    client.patch(
        f"/api/v1/admin/cars/{booking['car_id']}",
        headers=admin_headers,
        json={"daily_price": 99000},
    )
    response = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_cars"] == 1
    assert stats["active_cars"] == 1
    assert stats["completed_rental_value"] == 24000
    assert stats["bookings_by_status"]["completed"] == 1
    assert stats["pending_bookings"] == 0
    assert client.get("/api/v1/admin/stats", headers=user_headers).status_code == 403


def test_concurrent_status_changes_do_not_reactivate_booking(client, admin_headers, booking):
    barrier = Barrier(2)

    def change(status):
        barrier.wait(timeout=10)
        return client.patch(
            f"/api/v1/admin/bookings/{booking['id']}/status",
            headers=admin_headers,
            json={"status": status},
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(change, ["confirmed", "rejected"]))
    assert sorted(results) == [200, 409]


def test_empty_statistics_include_all_statuses(client, admin_headers):
    stats = client.get("/api/v1/admin/stats", headers=admin_headers).json()
    assert stats["completed_rental_value"] == 0
    assert len(stats["bookings_by_status"]) == 5
    assert sum(stats["bookings_by_status"].values()) == 0
