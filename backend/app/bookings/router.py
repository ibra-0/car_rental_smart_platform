from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import CurrentUser
from app.bookings.models import Booking
from app.bookings.pricing import calculate_price
from app.bookings.schemas import BookingRequest, BookingResponse, QuoteResponse
from app.bookings.service import create_booking, rental_car
from app.common import Page, Pagination
from app.db import get_db

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/quote", response_model=QuoteResponse)
def quote(data: BookingRequest, db: Session = Depends(get_db)) -> QuoteResponse:
    car = rental_car(db, data)
    price = calculate_price(data.starts_at, data.ends_at, car.hourly_price, car.daily_price)
    return QuoteResponse(**data.model_dump(), **price.model_dump())


@router.post("", response_model=BookingResponse, status_code=201)
def book(data: BookingRequest, user: CurrentUser, db: Session = Depends(get_db)) -> Booking:
    return create_booking(db, data, user.id)


@router.get("", response_model=Page[BookingResponse])
def my_bookings(
    user: CurrentUser, pagination: Annotated[Pagination, Query()], db: Session = Depends(get_db)
):
    statement = select(Booking).where(Booking.user_id == user.id)
    return {
        "items": db.scalars(
            statement.order_by(Booking.created_at.desc(), Booking.id.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
        ).all(),
        "total": db.scalar(select(func.count()).select_from(statement.subquery())),
        **pagination.model_dump(),
    }


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, user: CurrentUser, db: Session = Depends(get_db)) -> Booking:
    booking = db.scalar(select(Booking).where(Booking.id == booking_id, Booking.user_id == user.id))
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
