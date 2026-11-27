from enum import StrEnum

from sqlalchemy import Boolean, CheckConstraint, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class CarClass(StrEnum):
    ECONOMY = "economy"
    COMFORT = "comfort"
    SUV = "suv"


class Transmission(StrEnum):
    AUTOMATIC = "automatic"
    MANUAL = "manual"


class Car(Base):
    __tablename__ = "cars"
    __table_args__ = (
        CheckConstraint("year BETWEEN 1900 AND 2100", name="car_year"),
        CheckConstraint("seats BETWEEN 1 AND 9", name="car_seats"),
        CheckConstraint("hourly_price > 0 AND daily_price > 0", name="car_prices"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    brand: Mapped[str] = mapped_column(String(60))
    model: Mapped[str] = mapped_column(String(60))
    year: Mapped[int]
    car_class: Mapped[CarClass] = mapped_column(
        Enum(
            CarClass,
            native_enum=False,
            create_constraint=True,
            values_callable=lambda classes: [item.value for item in classes],
        )
    )
    transmission: Mapped[Transmission] = mapped_column(
        Enum(
            Transmission,
            native_enum=False,
            create_constraint=True,
            values_callable=lambda types: [item.value for item in types],
        )
    )
    seats: Mapped[int]
    description: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(2048))
    hourly_price: Mapped[int]
    daily_price: Mapped[int]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
