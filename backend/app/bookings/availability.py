from datetime import datetime

from sqlalchemy import exists, select

from app.bookings.models import BLOCKING_STATUSES, Booking
from app.cars.models import Car


def available_cars(starts_at: datetime, ends_at: datetime):
    overlap = exists().where(
        Booking.car_id == Car.id,
        Booking.status.in_(BLOCKING_STATUSES),
        Booking.starts_at < ends_at,
        Booking.ends_at > starts_at,
    )
    return select(Car).where(Car.is_active.is_(True), ~overlap)
