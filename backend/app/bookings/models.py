from datetime import datetime
from enum import StrEnum

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Enum, ForeignKey, Index, func, text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.auth.models import User
from app.cars.models import Car
from app.db import Base


class BookingStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


BLOCKING_STATUSES = (BookingStatus.PENDING, BookingStatus.CONFIRMED)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    car_id: Mapped[int] = mapped_column(ForeignKey("cars.id"))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[BookingStatus] = mapped_column(
        Enum(
            BookingStatus,
            native_enum=False,
            create_constraint=True,
            values_callable=lambda statuses: [status.value for status in statuses],
        ),
        default=BookingStatus.PENDING,
        server_default="pending",
    )
    billed_hours: Mapped[int]
    hourly_price: Mapped[int]
    daily_price: Mapped[int]
    subtotal: Mapped[int] = mapped_column(BigInteger)
    discount_percent: Mapped[int]
    total_price: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    car: Mapped[Car] = relationship(lazy="joined")
    user: Mapped[User] = relationship()

    __table_args__ = (
        CheckConstraint("ends_at > starts_at", name="booking_period"),
        CheckConstraint("billed_hours > 0", name="booking_hours"),
        CheckConstraint("hourly_price > 0 AND daily_price > 0", name="booking_rates"),
        CheckConstraint("discount_percent IN (0, 10, 20)", name="booking_discount"),
        CheckConstraint("subtotal > 0 AND total_price >= 0", name="booking_amounts"),
        Index("ix_bookings_user_created", "user_id", "created_at"),
        ExcludeConstraint(
            (car_id, "="),
            (func.tstzrange(starts_at, ends_at, "[)"), "&&"),
            where=text("status IN ('pending', 'confirmed')"),
            using="gist",
            name="bookings_no_overlap",
        ),
    )
