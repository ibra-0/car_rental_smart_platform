from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.bookings.availability import available_cars
from app.bookings.pricing import calculate_price
from app.bookings.schemas import QuoteResponse
from app.cars.models import Car, CarClass
from app.cars.schemas import CarResponse, Money
from app.common import OutputModel, RentalPeriod
from app.db import get_db

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(RentalPeriod):
    daily_budget: Money
    preferred_class: CarClass


class RecommendationResponse(OutputModel):
    car: CarResponse
    quote: QuoteResponse
    reasons: list[str]


@router.post("", response_model=list[RecommendationResponse])
def recommend(data: RecommendationRequest, db: Session = Depends(get_db)):
    cars = db.scalars(
        available_cars(data.starts_at, data.ends_at).where(Car.daily_price <= data.daily_budget)
    ).all()
    results = []
    for car in cars:
        price = calculate_price(data.starts_at, data.ends_at, car.hourly_price, car.daily_price)
        reasons = ["Within daily budget", "Available for the selected dates"]
        if car.car_class == data.preferred_class:
            reasons.append("Matches preferred class")
        if price.discount_percent:
            reasons.append("Long-term rental discount applied")
        results.append(
            RecommendationResponse(
                car=CarResponse.model_validate(car),
                quote=QuoteResponse(
                    car_id=car.id,
                    starts_at=data.starts_at,
                    ends_at=data.ends_at,
                    **price.model_dump(),
                ),
                reasons=reasons,
            )
        )
    results.sort(
        key=lambda result: (
            result.car.car_class != data.preferred_class,
            result.quote.total_price,
            result.car.id,
        )
    )
    return results[:5]
