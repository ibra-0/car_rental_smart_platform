import { useState } from "react";
import { Sparkles, Check, Compass } from "lucide-react";
import type { RecommendationRequest } from "../types";
import { recommend } from "../services/recommendationService";
import { useApp } from "../context/AppContext";
import { CarCard, EmptyState, PageHeading } from "../components/Common";
import { Button } from "../components/ui/Button";
export default function Recommendations() {
  const { cars } = useApp();
  const [request, setRequest] = useState<RecommendationRequest>({
    budget: 35000,
    budgetType: "daily",
    days: 3,
    passengers: 2,
    category: "",
    transmission: "",
    purpose: "City driving",
  });
  const [submitted, setSubmitted] = useState<RecommendationRequest | null>(
    null,
  );
  const results = submitted ? recommend(cars, submitted) : [];
  function update<K extends keyof RecommendationRequest>(
    k: K,
    v: RecommendationRequest[K],
  ) {
    setRequest({ ...request, [k]: v });
  }
  return (
    <div className="container page">
      <PageHeading
        eyebrow="A little help finding your way"
        title="Good plans deserve the right car."
        text="Tell us what your journey looks like. We’ll take care of the shortlist."
      />
      <div className="finder-layout">
        <form
          className="form-card"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted({ ...request });
          }}
        >
          <div className="row">
            <Sparkles className="accent" />
            <h2>Your journey, in a few details.</h2>
          </div>
          <div className="form-grid">
            <label>
              Budget (₸)
              <input
                type="number"
                min="1"
                max="100000000"
                required
                value={request.budget}
                onChange={(e) => update("budget", +e.target.value)}
              />
            </label>
            <label>
              Budget type
              <select
                value={request.budgetType}
                onChange={(e) =>
                  update("budgetType", e.target.value as "daily" | "total")
                }
              >
                <option value="daily">Per day</option>
                <option value="total">Whole rental</option>
              </select>
            </label>
            <label>
              Rental duration (days)
              <input
                type="number"
                min="1"
                max="365"
                required
                value={request.days}
                onChange={(e) => update("days", +e.target.value)}
              />
            </label>
            <label>
              Passengers
              <input
                type="number"
                min="1"
                max="7"
                required
                value={request.passengers}
                onChange={(e) => update("passengers", +e.target.value)}
              />
            </label>
            <label>
              Vehicle class
              <select
                value={request.category}
                onChange={(e) => update("category", e.target.value)}
              >
                <option value="">Open to possibilities</option>
                {["Economy", "Comfort", "SUV", "Premium"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Transmission
              <select
                value={request.transmission}
                onChange={(e) => update("transmission", e.target.value)}
              >
                <option value="">No preference</option>
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </label>
          </div>
          <label>
            What brings you to the road?
            <select
              value={request.purpose}
              onChange={(e) => update("purpose", e.target.value)}
            >
              {[
                "City driving",
                "Business trip",
                "Family travel",
                "Long-distance travel",
                "Premium experience",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Button type="submit">
            <Sparkles size={18} /> Find my matches
          </Button>
          <small>
            This demo uses transparent preference matching, not a trained AI
            model. Trip dates and availability are confirmed when booking.
          </small>
        </form>
        <aside className="finder-explainer">
          <div className="compass-symbol">
            <Compass size={88} strokeWidth={1} />
          </div>
          <h2>
            A car that fits.
            <br />A journey that flows.
          </h2>
          <p>
            We start with your budget and passenger needs, then look at your
            preferred class and the purpose of your trip.
          </p>
          <p>
            Planning to stay a while? We include the 20% long-term discount for
            rentals of 30 days or more.
          </p>
        </aside>
      </div>
      {submitted && (
        <section className="section" aria-live="polite">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Your personalised shortlist</span>
              <h2>{results.length} ways to get going.</h2>
            </div>
          </div>
          {results.length ? (
            <div className="car-grid">
              {results.slice(0, 6).map((r) => (
                <div className="recommendation-card" key={r.car.id}>
                  <CarCard car={r.car} />
                  <div className="match-reasons">
                    <strong>Why it fits your plans</strong>
                    {r.reasons.map((x) => (
                      <span key={x}>
                        <Check size={15} />
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Let’s open up the possibilities."
              text="Try a higher budget, fewer passengers, or a different vehicle class."
            />
          )}
        </section>
      )}
    </div>
  );
}
