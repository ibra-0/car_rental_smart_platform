from datetime import UTC, datetime, timedelta

import pytest

from app.bookings.pricing import calculate_price


@pytest.mark.parametrize(
    ("duration", "hours", "subtotal", "discount", "total"),
    [
        (timedelta(microseconds=1), 1, 2000, 0, 2000),
        (timedelta(hours=1), 1, 2000, 0, 2000),
        (timedelta(hours=1, microseconds=1), 2, 4000, 0, 4000),
        (timedelta(hours=15), 15, 20000, 0, 20000),
        (timedelta(hours=24), 24, 20000, 0, 20000),
        (timedelta(hours=26), 26, 24000, 0, 24000),
        (timedelta(days=7) - timedelta(microseconds=1), 168, 140000, 0, 140000),
        (timedelta(days=7), 168, 140000, 10, 126000),
        (timedelta(days=30) - timedelta(microseconds=1), 720, 600000, 10, 540000),
        (timedelta(days=30), 720, 600000, 20, 480000),
    ],
)
def test_price_boundaries(duration, hours, subtotal, discount, total):
    start = datetime(2030, 1, 1, tzinfo=UTC)
    price = calculate_price(start, start + duration, 2000, 20000)
    assert price.billed_hours == hours
    assert price.subtotal == subtotal
    assert price.discount_percent == discount
    assert price.total_price == total
    assert price.currency == "KZT"


def test_rounding_is_half_up_once_after_discount():
    start = datetime(2030, 1, 1, tzinfo=UTC)
    price = calculate_price(start, start + timedelta(days=7), 1, 5)
    assert price.subtotal == 35
    assert price.total_price == 32


def test_invalid_duration_is_an_error():
    start = datetime(2030, 1, 1, tzinfo=UTC)
    with pytest.raises(ValueError):
        calculate_price(start, start, 2000, 20000)
