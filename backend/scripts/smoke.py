"""Run the defense scenario over HTTP against a running API."""

import argparse
import os
import secrets
from datetime import UTC, datetime, timedelta

import httpx


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    with httpx.Client(base_url=args.base_url, timeout=15) as client:
        response = client.get("/health")
        response.raise_for_status()
        email = f"demo-{secrets.token_hex(6)}@example.com"
        password = secrets.token_urlsafe(24)
        response = client.post(
            "/api/v1/auth/register",
            json={"name": "Defense Demo", "email": email, "password": password},
        )
        response.raise_for_status()
        response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        response.raise_for_status()
        user_headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
        start = datetime.now(UTC) + timedelta(days=3)
        period = {
            "starts_at": start.isoformat(),
            "ends_at": (start + timedelta(hours=26)).isoformat(),
        }
        response = client.get("/api/v1/cars", params={**period, "limit": 1})
        response.raise_for_status()
        if not response.json()["items"]:
            raise SystemExit("No available cars; seed the catalog before running the demo")
        rental = {"car_id": response.json()["items"][0]["id"], **period}
        response = client.post("/api/v1/bookings/quote", json=rental)
        response.raise_for_status()
        total = response.json()["total_price"]
        response = client.post("/api/v1/bookings", headers=user_headers, json=rental)
        response.raise_for_status()
        booking = response.json()
        assert booking["status"] == "pending"
        assert booking["total_price"] == total
        response = client.post(
            "/api/v1/auth/login",
            json={"email": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"]},
        )
        response.raise_for_status()
        admin_headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
        response = client.patch(
            f"/api/v1/admin/bookings/{booking['id']}/status",
            headers=admin_headers,
            json={"status": "confirmed"},
        )
        response.raise_for_status()
        response = client.get(f"/api/v1/bookings/{booking['id']}", headers=user_headers)
        response.raise_for_status()
        assert response.json()["status"] == "confirmed"
        print(
            "PASS: register -> quote -> book -> confirm -> owner sees confirmed "
            f"(booking {booking['id']})"
        )


if __name__ == "__main__":
    main()
