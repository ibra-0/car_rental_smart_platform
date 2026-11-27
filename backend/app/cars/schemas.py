from typing import Annotated, Literal, Self

from pydantic import AwareDatetime, Field, HttpUrl, StringConstraints, model_validator

from app.cars.models import CarClass, Transmission
from app.common import InputModel, OutputModel, Pagination, validate_rental_period

CarName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
Money = Annotated[int, Field(gt=0, le=100_000_000, strict=True)]
Year = Annotated[int, Field(ge=1900, le=2100)]
Seats = Annotated[int, Field(ge=1, le=9)]
Description = Annotated[str, Field(max_length=5000)]
ImageURL = Annotated[HttpUrl, Field(max_length=2048)]


class CarCreate(InputModel):
    brand: CarName
    model: CarName
    year: Year
    car_class: CarClass
    transmission: Transmission
    seats: Seats
    description: Description
    image_url: ImageURL
    hourly_price: Money
    daily_price: Money
    is_active: bool = True


class CarUpdate(InputModel):
    brand: CarName | None = None
    model: CarName | None = None
    year: Year | None = None
    car_class: CarClass | None = None
    transmission: Transmission | None = None
    seats: Seats | None = None
    description: Description | None = None
    image_url: ImageURL | None = None
    hourly_price: Money | None = None
    daily_price: Money | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_null_fields(self) -> Self:
        if any(getattr(self, name) is None for name in self.model_fields_set):
            raise ValueError("Car fields cannot be null; omit unchanged fields")
        return self


class CarResponse(OutputModel):
    id: int
    brand: str
    model: str
    year: int
    car_class: CarClass
    transmission: Transmission
    seats: int
    description: str
    image_url: str
    hourly_price: int
    daily_price: int
    is_active: bool


class CarFilters(Pagination):
    starts_at: AwareDatetime | None = None
    ends_at: AwareDatetime | None = None
    q: str = Field(default="", max_length=100)
    brand: str | None = Field(default=None, max_length=60)
    car_class: CarClass | None = None
    min_price: int | None = Field(default=None, ge=0)
    max_price: int | None = Field(default=None, ge=0)
    sort: Literal["price_asc", "price_desc"] = "price_asc"

    @model_validator(mode="after")
    def ordered_prices(self) -> Self:
        if (self.starts_at is None) != (self.ends_at is None):
            raise ValueError("Provide both starts_at and ends_at")
        if self.starts_at is not None and self.ends_at is not None:
            validate_rental_period(self.starts_at, self.ends_at)
        if self.min_price is not None and self.max_price is not None:
            if self.min_price > self.max_price:
                raise ValueError("min_price must not exceed max_price")
        return self
