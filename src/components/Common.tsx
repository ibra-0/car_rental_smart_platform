import { Link } from "react-router-dom";
import {
  Gauge,
  Users,
  Fuel,
  CalendarDays,
  CheckCircle2,
  SearchX,
} from "lucide-react";
import type { Car, RentalPeriod } from "../types";
import { money, priceRental, localDate } from "../utils/rental";
import { Button } from "./ui/Button";
export function StatusBadge({ value }: { value: string }) {
  return <span className={`status ${value.toLowerCase()}`}>{value}</span>;
}
export function CarCard({ car, query = "" }: { car: Car; query?: string }) {
  return (
    <article className="car-card">
      <Link to={`/cars/${car.id}${query}`} className="car-photo">
        <img
          src={car.images[0]}
          alt={`${car.brand} ${car.model} — illustrative ${car.category.toLowerCase()} vehicle photograph`}
          loading="lazy"
        />
        <span className="car-category">{car.category}</span>
        {!car.available && (
          <span className="unavailable-tag">Currently reserved</span>
        )}
      </Link>
      <div className="car-info">
        <div className="row between">
          <h3>
            {car.brand} {car.model}
          </h3>
          <span className="year">{car.year}</span>
        </div>
        <div className="car-specs">
          <span>
            <Gauge size={15} />
            {car.transmission}
          </span>
          <span>
            <Users size={15} />
            {car.passengers} seats
          </span>
          <span>
            <Fuel size={15} />
            {car.fuel}
          </span>
        </div>
        <div className="car-bottom">
          <div>
            <strong>{money(car.dailyPrice)}</strong>
            <span> / day</span>
          </div>
          <Link className="text-link" to={`/cars/${car.id}${query}`}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
export function CarGrid({ cars, query = "" }: { cars: Car[]; query?: string }) {
  return (
    <div className="car-grid">
      {cars.map((c) => (
        <CarCard key={c.id} car={c} query={query} />
      ))}
    </div>
  );
}
export function EmptyState({
  title = "No cars found",
  text = "Try adjusting your filters to see more possibilities.",
  children,
}: {
  title?: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <SearchX size={36} />
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function ErrorState() {
  return (
    <div className="container page">
      <EmptyState
        title="This road doesn’t lead anywhere."
        text="We couldn’t find that vehicle or page. Explore the fleet to find your next drive."
      >
        <Button asChild>
          <Link to="/cars">Explore cars</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
export function DateRangeSelector({
  period,
  onChange,
}: {
  period: RentalPeriod;
  onChange: (p: RentalPeriod) => void;
}) {
  return (
    <div className="date-fields">
      <label>
        Pickup date & time
        <input
          aria-label="Pickup date and time"
          type="datetime-local"
          min={localDate() + "T00:00"}
          value={period.start}
          onChange={(e) => onChange({ ...period, start: e.target.value })}
          required
        />
      </label>
      <label>
        Return date & time
        <input
          aria-label="Return date and time"
          type="datetime-local"
          min={period.start}
          value={period.end}
          onChange={(e) => onChange({ ...period, end: e.target.value })}
          required
        />
      </label>
    </div>
  );
}
export function PriceSummary({
  car,
  period,
}: {
  car: Car;
  period: RentalPeriod;
}) {
  let price;
  try {
    price = priceRental(car, period);
  } catch {
    return (
      <p className="error">
        Select a valid rental period to calculate your price.
      </p>
    );
  }
  return (
    <div className="price-summary">
      <div className="row between">
        <span>
          {price.hours <= 6
            ? `${Math.ceil(price.hours)} hours`
            : `${price.days} days`}{" "}
          ×{" "}
          {price.hours <= 6 ? money(car.dailyPrice / 6) : money(car.dailyPrice)}
        </span>
        <span>{money(price.base)}</span>
      </div>
      <div className="row between">
        <span>Long-term discount {price.discount ? "(20%)" : ""}</span>
        <span>{price.discount ? `−${money(price.discount)}` : "—"}</span>
      </div>
      <div className="row between price-total">
        <strong>Estimated total</strong>
        <strong>{money(price.total)}</strong>
      </div>
      <small>No hidden demo charges. No payment required.</small>
    </div>
  );
}
export function Benefits() {
  return (
    <div className="benefit-strip container">
      {[
        ["Flexible by nature", "A day, a month, or somewhere in between."],
        ["A price you can trust", "Clear rates. Everything up front."],
        ["Ready when you are", "An easy start to every journey."],
      ].map(([title, text]) => (
        <div key={title}>
          <CheckCircle2 size={24} />
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">
        <CalendarDays size={15} />
        {eyebrow}
      </span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
