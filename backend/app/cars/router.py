from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.auth.dependencies import AdminUser
from app.bookings.availability import available_cars
from app.cars.models import Car
from app.cars.schemas import CarCreate, CarFilters, CarResponse, CarUpdate
from app.common import Page, Pagination
from app.db import get_db

router = APIRouter(prefix="/cars", tags=["cars"])
admin_router = APIRouter(prefix="/admin/cars", tags=["admin cars"])


@router.get("", response_model=Page[CarResponse])
def list_cars(filters: Annotated[CarFilters, Query()], db: Session = Depends(get_db)):
    statement = select(Car).where(Car.is_active.is_(True))
    if filters.starts_at is not None:
        statement = available_cars(filters.starts_at, filters.ends_at)
    if filters.q:
        statement = statement.where(
            or_(
                Car.brand.icontains(filters.q, autoescape=True),
                Car.model.icontains(filters.q, autoescape=True),
            )
        )
    if filters.brand is not None:
        statement = statement.where(func.lower(Car.brand) == filters.brand.lower())
    if filters.car_class is not None:
        statement = statement.where(Car.car_class == filters.car_class)
    if filters.min_price is not None:
        statement = statement.where(Car.daily_price >= filters.min_price)
    if filters.max_price is not None:
        statement = statement.where(Car.daily_price <= filters.max_price)
    total = db.scalar(select(func.count()).select_from(statement.subquery()))
    price_order = Car.daily_price.asc() if filters.sort == "price_asc" else Car.daily_price.desc()
    items = db.scalars(
        statement.order_by(price_order, Car.id).limit(filters.limit).offset(filters.offset)
    ).all()
    return {"items": items, "total": total, "limit": filters.limit, "offset": filters.offset}


@router.get("/{car_id}", response_model=CarResponse)
def get_car(car_id: int, db: Session = Depends(get_db)) -> Car:
    car = db.get(Car, car_id)
    if car is None or not car.is_active:
        raise HTTPException(status_code=404, detail="Car not found")
    return car


@admin_router.get("", response_model=Page[CarResponse])
def admin_cars(
    admin: AdminUser, pagination: Annotated[Pagination, Query()], db: Session = Depends(get_db)
):
    items = db.scalars(
        select(Car).order_by(Car.id).limit(pagination.limit).offset(pagination.offset)
    ).all()
    return {
        "items": items,
        "total": db.scalar(select(func.count()).select_from(Car)),
        **pagination.model_dump(),
    }


@admin_router.post("", response_model=CarResponse, status_code=201)
def create_car(data: CarCreate, admin: AdminUser, db: Session = Depends(get_db)) -> Car:
    car = Car(**data.model_dump(mode="json"))
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@admin_router.patch("/{car_id}", response_model=CarResponse)
def update_car(
    car_id: int, data: CarUpdate, admin: AdminUser, db: Session = Depends(get_db)
) -> Car:
    car = db.get(Car, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found")
    for name, value in data.model_dump(mode="json", exclude_unset=True).items():
        setattr(car, name, value)
    db.commit()
    db.refresh(car)
    return car
