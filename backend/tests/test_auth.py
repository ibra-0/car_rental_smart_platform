from datetime import UTC, datetime, timedelta

import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.models import Role, User
from app.auth.security import password_hash
from app.cli import create_admin
from app.config import get_settings

SIGNUP = {"name": "Alice", "email": "Alice@Example.com", "password": "a strong password"}


def test_registration_hashes_password_and_normalizes_email(client, engine):
    response = client.post("/api/v1/auth/register", json=SIGNUP)
    assert response.status_code == 201
    assert response.json()["role"] == "user"
    assert response.json()["email"] == "alice@example.com"
    assert "password_hash" not in response.json()
    with Session(engine) as db:
        user = db.scalar(select(User))
        assert user.password_hash != SIGNUP["password"]
        assert password_hash.verify(SIGNUP["password"], user.password_hash)
    assert client.post("/api/v1/auth/register", json=SIGNUP).status_code == 409


def test_registration_cannot_choose_role(client):
    assert client.post("/api/v1/auth/register", json={**SIGNUP, "role": "admin"}).status_code == 422


def test_login_and_profile(client, user_headers):
    response = client.get("/api/v1/auth/me", headers=user_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
    assert client.get("/api/v1/auth/me").status_code == 401
    for email in ["user@example.com", "absent@example.com"]:
        response = client.post(
            "/api/v1/auth/login", json={"email": email, "password": "incorrect-password"}
        )
        assert response.status_code == 401


def test_invalid_and_expired_tokens(client, user_headers):
    now = datetime.now(UTC)
    token = jwt.encode(
        {"sub": "1", "iat": now - timedelta(hours=2), "exp": now - timedelta(hours=1)},
        get_settings().jwt_secret.get_secret_value(),
        algorithm="HS256",
    )
    for invalid_token in [token, "invalid-token"]:
        assert (
            client.get(
                "/api/v1/auth/me", headers={"Authorization": f"Bearer {invalid_token}"}
            ).status_code
            == 401
        )


def test_create_admin_uses_environment(client, engine, monkeypatch):
    monkeypatch.setenv("ADMIN_PASSWORD", "admin-secret-password")
    create_admin("Owner@Example.com", "Owner")
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.com", "password": "admin-secret-password"},
    )
    assert response.status_code == 200
    with Session(engine) as db:
        assert db.scalar(select(User)).role == Role.ADMIN
