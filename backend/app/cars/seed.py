from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cars.models import Car
from app.cars.schemas import CarCreate

DEMO_CARS = [
    ("Hyundai", "Accent", "economy", 1200, 12000),
    ("Kia", "Rio", "economy", 1300, 13000),
    ("Chevrolet", "Cobalt", "economy", 1000, 10000),
    ("Volkswagen", "Polo", "economy", 1400, 14000),
    ("Toyota", "Camry", "comfort", 2500, 25000),
    ("Hyundai", "Sonata", "comfort", 2200, 22000),
    ("Kia", "K5", "comfort", 2400, 24000),
    ("Skoda", "Octavia", "comfort", 2000, 20000),
    ("Toyota", "RAV4", "suv", 3000, 30000),
    ("Hyundai", "Tucson", "suv", 2800, 28000),
    ("Kia", "Sportage", "suv", 2900, 29000),
    ("Nissan", "X-Trail", "suv", 2700, 27000),
]


def seed_cars(db: Session) -> int:
    if db.scalar(select(Car.id).limit(1)) is not None:
        raise SystemExit("Catalog is not empty; no demo cars were added")
    for brand, model, car_class, hourly, daily in DEMO_CARS:
        data = CarCreate(
            brand=brand,
            model=model,
            year=2024,
            car_class=car_class,
            transmission="automatic",
            seats=5,
            description=f"Demo {brand} {model} for city trips and longer rentals.",
            image_url="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200",
            hourly_price=hourly,
            daily_price=daily,
        )
        db.add(Car(**data.model_dump(mode="json")))
    db.commit()
    return len(DEMO_CARS)
