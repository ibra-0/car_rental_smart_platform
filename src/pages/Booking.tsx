import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  defaultPeriod,
  validateCustomer,
  validateDates,
  canBook,
} from "../utils/rental";
import {
  DateRangeSelector,
  ErrorState,
  PageHeading,
  PriceSummary,
} from "../components/Common";
import { Button } from "../components/ui/Button";
export default function Booking() {
  const { carId } = useParams();
  const [params] = useSearchParams();
  const { cars, bookings, user, createBooking } = useApp();
  const car = cars.find((c) => c.id === carId);
  const [period, setPeriod] = useState({
    start: params.get("start") || defaultPeriod().start,
    end: params.get("end") || defaultPeriod().end,
  });
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [location, setLocation] = useState(
    params.get("location") || "Almaty city centre",
  );
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState("");
  if (!car) return <ErrorState />;
  if (confirmed)
    return (
      <div className="container page confirmation">
        <CheckCircle2 size={56} />
        <span className="eyebrow">Your next chapter is booked</span>
        <h1>You’re on your way.</h1>
        <p>
          Your demo reservation for the {car.brand} {car.model} is confirmed.
          <br />
          No real booking or payment has been made.
        </p>
        <div className="notice">
          Reservation {confirmed.slice(0, 8).toUpperCase()} ·{" "}
          {period.start.replace("T", " ")} to {period.end.replace("T", " ")}
        </div>
        <Button asChild>
          <Link to="/dashboard">View my bookings</Link>
        </Button>
      </div>
    );
  return (
    <div className="container page">
      <PageHeading
        eyebrow="One step closer"
        title="Make the journey yours."
        text="A few details, and you’re ready for your next drive."
      />
      <div className="notice">
        <LockKeyhole size={18} /> Demonstration booking only. Use fictional
        details. Personal information stays in memory and is never saved.
      </div>
      <div className="checkout-layout">
        <form
          className="form-card"
          onSubmit={(e) => {
            e.preventDefault();
            const problem =
              validateCustomer(name, email) ||
              validateDates(period) ||
              (!accepted
                ? "Accept the demonstration rental terms to continue."
                : "") ||
              (!canBook(car, period, bookings)
                ? "This vehicle is unavailable for these dates."
                : "");
            setError(problem);
            if (!problem)
              try {
                setConfirmed(createBooking(car, period, location).id);
              } catch (e) {
                setError((e as Error).message);
              }
          }}
        >
          <h2>Your details</h2>
          <div className="form-grid">
            <label>
              Full name
              <input
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Driver"
                required
                minLength={2}
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
              />
            </label>
          </div>
          <h2>Your rental period</h2>
          <DateRangeSelector period={period} onChange={setPeriod} />
          <div className="form-grid">
            <label>
              Pickup location
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option>Almaty city centre</option>
                <option>Almaty airport</option>
              </select>
            </label>
            <label>
              Return location
              <input value={location} readOnly />
              <small>Demo rentals return to the pickup location.</small>
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              required
            />
            <span>
              I agree to the demonstration rental terms: 21+ driver, valid
              licence, same-fuel return, and 200 km/day allowance. I understand
              this creates no real reservation.
            </span>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit">Confirm demo booking</Button>
        </form>
        <aside className="summary-card">
          <img
            src={car.images[0]}
            alt={`${car.brand} ${car.model}, illustrative image`}
          />
          <div>
            <span className="eyebrow">Your chosen drive</span>
            <h2>
              {car.brand} {car.model}
            </h2>
            <p>
              {car.year} · {car.transmission} · {car.passengers} seats
            </p>
            <PriceSummary car={car} period={period} />
          </div>
        </aside>
      </div>
    </div>
  );
}
