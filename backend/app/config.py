from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore"
    )

    database_url: str
    jwt_secret: SecretStr = Field(min_length=32)
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("database_url")
    @classmethod
    def postgresql_url(cls, value: str) -> str:
        url = make_url(value)
        if url.get_backend_name() not in {"postgresql", "postgres"}:
            raise ValueError("DATABASE_URL must point to PostgreSQL")
        return url.set(drivername="postgresql+psycopg").render_as_string(hide_password=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()
