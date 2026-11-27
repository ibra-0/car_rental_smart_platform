from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import AdminUser
from app.bookings.models import Booking, BookingStatus
from app.bookings.schemas import (
    AdminBookingResponse,
    BookingFilters,
    StatsResponse,
    StatusUpdate,
)
from app.bookings.service import update_status
from app.cars.models import Car
from app.common import Page
from app.db import get_db

router = APIRouter(prefix="/admin", tags=["admin bookings"])


@router.get("/bookings", response_model=Page[AdminBookingResponse])
def list_bookings(
    admin: AdminUser, filters: Annotated[BookingFilters, Query()], db: Session = Depends(get_db)
):
    statement = select(Booking)
    if filters.status is not None:
        statement = statement.where(Booking.status == filters.status)
    return {
        "items": db.scalars(
            statement.options(selectinload(Booking.user))
            .order_by(Booking.created_at.desc(), Booking.id.desc())
            .limit(filters.limit)
            .offset(filters.offset)
        ).all(),
        "total": db.scalar(select(func.count()).select_from(statement.subquery())),
        "limit": filters.limit,
        "offset": filters.offset,
    }


@router.patch("/bookings/{booking_id}/status", response_model=AdminBookingResponse)
def change_status(
    booking_id: int, data: StatusUpdate, admin: AdminUser, db: Session = Depends(get_db)
) -> Booking:
    booking = db.scalar(select(Booking).where(Booking.id == booking_id).with_for_update(of=Booking))
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return update_status(db, booking, data.status)


@router.get("/stats", response_model=StatsResponse)
def stats(admin: AdminUser, db: Session = Depends(get_db)) -> StatsResponse:
    counts = dict(db.execute(select(Booking.status, func.count()).group_by(Booking.status)).all())
    by_status = {status: counts.get(status, 0) for status in BookingStatus}
    return StatsResponse(
        total_cars=db.scalar(select(func.count()).select_from(Car)),
        active_cars=db.scalar(select(func.count()).select_from(Car).where(Car.is_active.is_(True))),
        pending_bookings=by_status[BookingStatus.PENDING],
        bookings_by_status=by_status,
        completed_rental_value=db.scalar(
            select(func.coalesce(func.sum(Booking.total_price), 0)).where(
                Booking.status == BookingStatus.COMPLETED
            )
        ),
    )
