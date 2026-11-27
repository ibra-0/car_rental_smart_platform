from datetime import datetime

from pydantic import Field

from app.auth.schemas import UserResponse
from app.bookings.models import BookingStatus
from app.bookings.pricing import PriceBreakdown
from app.cars.schemas import CarResponse
from app.common import InputModel, OutputModel, Pagination, RentalPeriod


class BookingRequest(RentalPeriod):
    car_id: int = Field(gt=0)


class QuoteResponse(PriceBreakdown):
    car_id: int
    starts_at: datetime
    ends_at: datetime


class BookingResponse(PriceBreakdown, OutputModel):
    id: int
    user_id: int
    car_id: int
    starts_at: datetime
    ends_at: datetime
    status: BookingStatus
    created_at: datetime
    car: CarResponse


class StatusUpdate(InputModel):
    status: BookingStatus


class BookingFilters(Pagination):
    status: BookingStatus | None = None


class AdminBookingResponse(BookingResponse):
    user: UserResponse


class StatsResponse(OutputModel):
    total_cars: int
    active_cars: int
    pending_bookings: int
    bookings_by_status: dict[BookingStatus, int]
    completed_rental_value: int
    currency: str = "KZT"
