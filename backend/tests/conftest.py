import os

import pytest
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
    yield engine
    engine.dispose()


@pytest.fixture
def client(engine):
    def test_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = test_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
