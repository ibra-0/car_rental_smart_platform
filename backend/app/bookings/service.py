from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.bookings.availability import available_cars
from app.bookings.models import Booking
from app.bookings.pricing import calculate_price
from app.bookings.schemas import BookingRequest
from app.cars.models import Car


def rental_car(db: Session, data: BookingRequest, *, lock: bool = False) -> Car:
    statement = select(Car).where(Car.id == data.car_id, Car.is_active.is_(True))
    if lock:
        statement = statement.with_for_update()
    car = db.scalar(statement)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found")
    if db.scalar(available_cars(data.starts_at, data.ends_at).where(Car.id == car.id)) is None:
        raise HTTPException(status_code=409, detail="Car unavailable for the selected period")
    return car


def create_booking(db: Session, data: BookingRequest, user_id: int) -> Booking:
    car = rental_car(db, data, lock=True)
    price = calculate_price(data.starts_at, data.ends_at, car.hourly_price, car.daily_price)
    booking = Booking(
        user_id=user_id,
        **data.model_dump(),
        **price.model_dump(exclude={"currency"}),
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if exc.orig.sqlstate != "23P01":
            raise
        raise HTTPException(
            status_code=409, detail="Car unavailable for the selected period"
        ) from exc
    db.refresh(booking)
    return booking
