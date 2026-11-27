from datetime import datetime

from pydantic import Field

from app.bookings.models import BookingStatus
from app.bookings.pricing import PriceBreakdown
from app.cars.schemas import CarResponse
from app.common import OutputModel, RentalPeriod


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
