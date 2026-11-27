from datetime import UTC, datetime
from typing import Self

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class OutputModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page[T](BaseModel):
    items: list[T]
    total: int
    limit: int
    offset: int


class Pagination(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


def validate_rental_period(starts_at: datetime, ends_at: datetime) -> None:
    if starts_at <= datetime.now(UTC):
        raise ValueError("Rental must start in the future")
    if ends_at <= starts_at:
        raise ValueError("Rental end must be after its start")


class RentalPeriod(InputModel):
    starts_at: AwareDatetime
    ends_at: AwareDatetime

    @model_validator(mode="after")
    def valid_period(self) -> Self:
        validate_rental_period(self.starts_at, self.ends_at)
        return self
