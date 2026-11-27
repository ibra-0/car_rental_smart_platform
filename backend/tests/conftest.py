import os

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

TEST_DATABASE_URL = os.environ["TEST_DATABASE_URL"]
if not make_url(TEST_DATABASE_URL).database.endswith("_test"):
    raise RuntimeError("TEST_DATABASE_URL database name must end with _test")
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["JWT_SECRET"] = "test-only-secret-key-with-at-least-32-characters"

from app.db import get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    command.upgrade(Config("alembic.ini"), "head")
    yield engine
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_database(engine):
    from app.db import Base

    with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())


@pytest.fixture
def client(engine):
    def test_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = test_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def user_headers(client):
    data = {"name": "Test User", "email": "user@example.com", "password": "secure-password"}
    assert client.post("/api/v1/auth/register", json=data).status_code == 201
    token = client.post(
        "/api/v1/auth/login", json={"email": data["email"], "password": data["password"]}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, engine):
    from app.auth.models import Role, User
    from app.auth.security import create_token, password_hash

    with Session(engine) as db:
        admin = User(
            name="Admin",
            email="admin@example.com",
            role=Role.ADMIN,
            password_hash=password_hash.hash("admin-password"),
        )
        db.add(admin)
        db.commit()
        token = create_token(admin.id)
    return {"Authorization": f"Bearer {token}"}
