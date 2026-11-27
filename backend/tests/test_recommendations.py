from datetime import datetime, timedelta

from tests.data import CAR


def recommendation_input(rental, **changes):
    return {
        "starts_at": rental["starts_at"],
        "ends_at": rental["ends_at"],
        "daily_budget": 30000,
        "preferred_class": "comfort",
        **changes,
    }


def test_recommendations_rank_class_then_total_and_explain(client, admin_headers, car, rental):
    for model, car_class, hourly, daily in [
        ("Rio", "economy", 1000, 10000),
        ("Sonata", "comfort", 1500, 15000),
        ("Expensive", "comfort", 4000, 40000),
    ]:
        client.post(
            "/api/v1/admin/cars",
            headers=admin_headers,
            json={
                **CAR,
                "model": model,
                "car_class": car_class,
                "hourly_price": hourly,
                "daily_price": daily,
            },
        )
    response = client.post("/api/v1/recommendations", json=recommendation_input(rental))
    assert response.status_code == 200, response.text
    results = response.json()
    assert [result["car"]["model"] for result in results] == ["Sonata", "Camry", "Rio"]
    assert "Matches preferred class" in results[0]["reasons"]
    assert "Matches preferred class" not in results[-1]["reasons"]
    quote = client.post(
        "/api/v1/bookings/quote", json={**rental, "car_id": results[0]["car"]["id"]}
    ).json()
    assert results[0]["quote"]["total_price"] == quote["total_price"]


def test_recommendations_exclude_busy_and_inactive_and_allow_empty(
    client, admin_headers, rental, booking
):
    assert client.post("/api/v1/recommendations", json=recommendation_input(rental)).json() == []
    client.post("/api/v1/admin/cars", headers=admin_headers, json={**CAR, "is_active": False})
    assert client.post("/api/v1/recommendations", json=recommendation_input(rental)).json() == []
    assert (
        client.post(
            "/api/v1/recommendations", json=recommendation_input(rental, daily_budget=1)
        ).json()
        == []
    )


def test_recommendations_limit_and_discount(client, admin_headers, car, rental):
    for index in range(6):
        client.post(
            "/api/v1/admin/cars", headers=admin_headers, json={**CAR, "model": f"Car {index}"}
        )
    end = (datetime.fromisoformat(rental["starts_at"]) + timedelta(days=30)).isoformat()
    response = client.post(
        "/api/v1/recommendations", json=recommendation_input(rental, ends_at=end)
    )
    assert response.status_code == 200
    assert len(response.json()) == 5
    for result in response.json():
        assert result["quote"]["discount_percent"] == 20
        assert "Long-term rental discount applied" in result["reasons"]
