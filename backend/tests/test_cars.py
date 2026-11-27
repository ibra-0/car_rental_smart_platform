import pytest
from sqlalchemy.orm import Session

from app.cars.seed import seed_cars
from tests.data import CAR


def test_admin_permissions(client, user_headers):
    for headers, expected in [({}, 401), (user_headers, 403)]:
        assert client.post("/api/v1/admin/cars", headers=headers, json=CAR).status_code == expected
        assert client.get("/api/v1/admin/cars", headers=headers).status_code == expected


def test_catalog_filters_pagination_and_hidden_cars(client, admin_headers, car):
    client.post(
        "/api/v1/admin/cars",
        headers=admin_headers,
        json={**CAR, "brand": "Kia", "model": "Rio", "car_class": "economy", "daily_price": 10000},
    )
    response = client.get("/api/v1/cars", params={"q": "CAM", "car_class": "comfort"})
    assert response.status_code == 200, response.text
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == car["id"]
    response = client.get("/api/v1/cars", params={"limit": 1, "offset": 1})
    assert response.json()["total"] == 2
    assert response.json()["items"][0]["model"] == "Camry"
    assert client.get("/api/v1/cars", params={"max_price": 15000}).json()["total"] == 1
    assert client.get("/api/v1/cars", params={"brand": "TOYOTA"}).json()["total"] == 1
    assert client.get("/api/v1/cars", params={"q": "%"}).json()["total"] == 0
    response = client.patch(
        f"/api/v1/admin/cars/{car['id']}", headers=admin_headers, json={"is_active": False}
    )
    assert response.status_code == 200
    assert client.get(f"/api/v1/cars/{car['id']}").status_code == 404
    assert client.get("/api/v1/cars").json()["total"] == 1
    assert client.get("/api/v1/admin/cars", headers=admin_headers).json()["total"] == 2


def test_car_validation(client, admin_headers, car):
    for change in [
        {"daily_price": 0},
        {"seats": 0},
        {"image_url": "not-a-url"},
        {"hourly_price": 2.5},
        {"brand": None},
    ]:
        assert (
            client.patch(
                f"/api/v1/admin/cars/{car['id']}", headers=admin_headers, json=change
            ).status_code
            == 422
        )
    assert (
        client.get("/api/v1/cars", params={"min_price": 200, "max_price": 100}).status_code == 422
    )
    assert client.get("/api/v1/cars", params={"limit": 101}).status_code == 422


def test_seed_adds_twelve_cars_without_duplicates(client, engine):
    with Session(engine) as db:
        assert seed_cars(db) == 12
        with pytest.raises(SystemExit):
            seed_cars(db)
    assert client.get("/api/v1/cars").json()["total"] == 12
