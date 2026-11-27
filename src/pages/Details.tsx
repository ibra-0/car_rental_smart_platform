import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Check,
  Users,
  Gauge,
  Fuel,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { canBook, defaultPeriod, money, validateDates } from "../utils/rental";
import {
  CarGrid,
  DateRangeSelector,
  ErrorState,
  PriceSummary,
  StatusBadge,
} from "../components/Common";
import { Button } from "../components/ui/Button";
export default function Details() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { cars, bookings } = useApp();
  const car = cars.find((c) => c.id === id);
  const [period, setPeriod] = useState({
    start: params.get("start") || defaultPeriod().start,
    end: params.get("end") || defaultPeriod().end,
  });
  const [image, setImage] = useState(0);
  if (!car) return <ErrorState />;
  const valid = canBook(car, period, bookings);
  const problem = validateDates(period);
  const query = new URLSearchParams({
    ...period,
    location: params.get("location") || "Almaty city centre",
  });
  return (
    <div className="container page">
      <Link className="back-link" to="/cars">
        <ChevronLeft size={16} /> Back to the collection
      </Link>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">
            {car.category} collection · {car.year}
          </span>
          <h1>
            {car.brand} {car.model}
          </h1>
        </div>
        <StatusBadge value={car.available ? "Available" : "Reserved"} />
      </div>
      <div className="detail-layout">
        <div>
          <div className="gallery-main">
            <img
              src={car.images[image]}
              alt={
                image === 0
                  ? `${car.brand} ${car.model} illustrative vehicle`
                  : "Illustrative vehicle interior"
              }
            />
            <span>Illustrative photography</span>
          </div>
          <div className="gallery-thumbs">
            {car.images.map((src, i) => (
              <button
                className={image === i ? "active" : ""}
                key={src}
                onClick={() => setImage(i)}
                aria-label={`View ${i === 0 ? "exterior" : "interior"}`}
              >
                <img src={src} alt={i === 0 ? "Exterior" : "Interior"} />
              </button>
            ))}
          </div>
          <h2>A good drive, beautifully simple.</h2>
          <p className="description">{car.description}</p>
          <div className="detail-specs">
            <div>
              <Gauge />
              <span>
                Transmission<strong>{car.transmission}</strong>
              </span>
            </div>
            <div>
              <Users />
              <span>
                Capacity<strong>{car.passengers} passengers</strong>
              </span>
            </div>
            <div>
              <Fuel />
              <span>
                Fuel type<strong>{car.fuel}</strong>
              </span>
            </div>
          </div>
          <h3>Everything you need, included.</h3>
          <div className="features-list">
            {car.features.map((f) => (
              <span key={f}>
                <Check size={17} />
                {f}
              </span>
            ))}
          </div>
          <div className="conditions">
            <ShieldCheck />
            <div>
              <h3>A few things before you go</h3>
              <p>
                Demo eligibility: drivers aged 21+ with a valid licence and at
                least 2 years’ experience. Return with the same fuel level.
                Mileage allowance: 200 km/day. Final terms, deposits, and
                insurance must be agreed with the backend team before launch.
              </p>
            </div>
          </div>
        </div>
        <aside className="booking-panel">
          <div className="row between">
            <div>
              <strong className="daily-price">{money(car.dailyPrice)}</strong>
              <span> / day</span>
            </div>
            <span className="discount-badge">−20% monthly</span>
          </div>
          <p>More time on the road. Less to think about.</p>
          <DateRangeSelector period={period} onChange={setPeriod} />
          <PriceSummary car={car} period={period} />
          {!valid && (
            <p className="error" role="alert">
              {problem ||
                "This car is unavailable for this period. Try different dates or another car."}
            </p>
          )}
          <Button asChild={valid} disabled={!valid}>
            {valid ? (
              <Link to={`/booking/${car.id}?${query}`}>Book this car</Link>
            ) : (
              "Currently unavailable"
            )}
          </Button>
          <div className="panel-note">
            <ShieldCheck size={16} /> Demo reservation. No payment required.
          </div>
          <small>
            1–6 hours: daily rate ÷ 6 per started hour. Longer rentals: per
            started 24 hours. 30+ full days: 20% off.
          </small>
        </aside>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Keep your options open</span>
            <h2>You might also like.</h2>
          </div>
        </div>
        <CarGrid
          cars={cars.filter((c) => c.id !== car.id && c.available).slice(0, 3)}
        />
      </section>
    </div>
  );
}
