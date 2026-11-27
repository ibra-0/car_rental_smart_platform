def test_health_checks_database(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_frontend_only(client):
    headers = {"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"}
    response = client.options("/api/v1/auth/login", headers=headers)
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    headers["Origin"] = "https://unknown.example"
    assert client.options("/api/v1/auth/login", headers=headers).status_code == 400
