import pytest
from pydantic import ValidationError
from sqlalchemy.engine import make_url

from app.config import Settings


@pytest.mark.parametrize("scheme", ["postgres", "postgresql", "postgresql+psycopg"])
def test_database_urls_use_psycopg_without_changing_credentials(scheme):
    settings = Settings(
        _env_file=None,
        database_url=f"{scheme}://user:p%40ss@localhost:5432/driverent?sslmode=require",
        jwt_secret="x" * 32,
    )
    url = make_url(settings.database_url)
    assert url.drivername == "postgresql+psycopg"
    assert url.password == "p@ss"
    assert url.query["sslmode"] == "require"


def test_non_postgresql_database_is_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url="sqlite:///test.db", jwt_secret="x" * 32)


def test_short_signing_secret_is_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url="postgresql://user@localhost/db", jwt_secret="short")
