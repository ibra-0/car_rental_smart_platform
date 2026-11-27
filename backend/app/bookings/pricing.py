from datetime import datetime, timedelta
from typing import Literal

from pydantic import BaseModel


class PriceBreakdown(BaseModel):
    billed_hours: int
    hourly_price: int
    daily_price: int
    subtotal: int
    discount_percent: int
    total_price: int
    currency: Literal["KZT"] = "KZT"


def calculate_price(
    starts_at: datetime, ends_at: datetime, hourly_price: int, daily_price: int
) -> PriceBreakdown:
    duration = ends_at - starts_at
    if duration <= timedelta(0):
        raise ValueError("Rental end must be after its start")
    hours, remainder = divmod(duration, timedelta(hours=1))
    billed_hours = hours + bool(remainder)
    days, extra_hours = divmod(billed_hours, 24)
    subtotal = days * daily_price + min(extra_hours * hourly_price, daily_price)
    discount = 20 if duration >= timedelta(days=30) else 10 if duration >= timedelta(days=7) else 0
    total = (subtotal * (100 - discount) + 50) // 100
    return PriceBreakdown(
        billed_hours=billed_hours,
        hourly_price=hourly_price,
        daily_price=daily_price,
        subtotal=subtotal,
        discount_percent=discount,
        total_price=total,
    )
