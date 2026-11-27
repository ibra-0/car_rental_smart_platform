import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { defaultPeriod, validateDates, localDate } from "../utils/rental";
import { Button } from "./ui/Button";
export function SearchBar() {
  const [term, setTerm] = useState("short");
  const [location, setLocation] = useState("Almaty city centre");
  const [start, setStart] = useState(defaultPeriod().start.slice(0, 10));
  const [end, setEnd] = useState(defaultPeriod().end.slice(0, 10));
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  return (
    <form
      className="search-widget"
      onSubmit={(e) => {
        e.preventDefault();
        const problem = validateDates({
          start: start + "T10:00",
          end: end + "T10:00",
        });
        setError(problem);
        if (!problem)
          navigate(
            "/cars?" +
              new URLSearchParams({
                start: start + "T10:00",
                end: end + "T10:00",
                category,
                location,
                term,
              }),
          );
      }}
    >
      <div className="rental-tabs" role="group" aria-label="Rental type">
        <button
          type="button"
          className={term === "short" ? "selected" : ""}
          onClick={() => {
            setTerm("short");
            setEnd(localDate(4));
          }}
        >
          Short-term rental
        </button>
        <button
          type="button"
          className={term === "long" ? "selected" : ""}
          onClick={() => {
            setTerm("long");
            setEnd(localDate(31));
          }}
        >
          Long-term rental <span>Save 20%</span>
        </button>
      </div>
      <div className="search-fields">
        <label>
          <span>
            <MapPin size={15} /> Pickup location
          </span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option>Almaty city centre</option>
            <option>Almaty airport</option>
          </select>
        </label>
        <label>
          Pickup date
          <input
            type="date"
            min={localDate()}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </label>
        <label>
          Return date
          <input
            type="date"
            min={start}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
        <label>
          Vehicle class
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All vehicles</option>
            {["Economy", "Comfort", "SUV", "Premium"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <Button type="submit">
          <Search size={18} /> Find a car
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
