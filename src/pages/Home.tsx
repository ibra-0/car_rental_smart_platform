import { Link } from "react-router-dom";
import {
  Compass,
  ShieldCheck,
  CarFront,
  MapPin,
  Sparkles,
  CalendarCheck,
  KeyRound,
} from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { CarGrid, Benefits } from "../components/Common";
import { Button } from "../components/ui/Button";
import { useApp } from "../context/AppContext";
export default function Home() {
  const { cars } = useApp();
  return (
    <>
      <section className="hero container">
        <div className="hero-photo">
          <img
            src="/images/hero.jpg"
            alt="Dark sports sedan on an open road"
            fetchPriority="high"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <span className="hero-label">
              <span /> Your journey, your way
            </span>
            <h1>
              A better way
              <br />
              to drive.
            </h1>
            <p>
              From city streets to weekend escapes.
              <br />
              Find the right car for wherever life takes you.
            </p>
            <Button asChild>
              <Link to="/cars">Explore our fleet</Link>
            </Button>
          </div>
          <div className="hero-caption">
            <MapPin size={16} />
            <span>Good roads. Great possibilities.</span>
          </div>
          <div className="hero-side">Built around your journey</div>
        </div>
        <SearchBar />
      </section>
      <Benefits />
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The right car changes everything</span>
            <h2>Meet your next drive.</h2>
            <p>Thoughtfully selected. Ready for the road.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/cars">View all cars</Link>
          </Button>
        </div>
        <CarGrid cars={cars.filter((c) => c.available).slice(0, 3)} />
        <p className="photo-note">
          Vehicle photography is illustrative. All rates are fictional demo
          prices.
        </p>
      </section>
      <section className="categories-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Every kind of journey</span>
              <h2>What’s your driving style?</h2>
            </div>
            <p>
              A little everyday freedom.
              <br />
              Or something out of the ordinary.
            </p>
          </div>
          <div className="category-grid">
            {[
              {
                name: "Economy",
                copy: "Small footprint. Big possibilities.",
                image: "camry",
              },
              {
                name: "Comfort",
                copy: "Your everyday, elevated.",
                image: "mercedes",
              },
              { name: "SUV", copy: "Make room for adventure.", image: "suv" },
              {
                name: "Premium",
                copy: "Arrive a little differently.",
                image: "bmw",
              },
            ].map((c) => (
              <Link
                className="category-card"
                to={`/cars?category=${c.name}`}
                key={c.name}
              >
                <img
                  src={`/images/${c.image}.jpg`}
                  alt={`${c.name} vehicle category`}
                  loading="lazy"
                />
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.copy}</p>
                </div>
                <span className="category-icon">
                  <CarFront size={19} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section container finder-banner">
        <div className="finder-art">
          <Compass strokeWidth={0.7} />
          <div className="finder-art-label">
            <Sparkles size={18} /> A little direction goes a long way.
          </div>
        </div>
        <div>
          <span className="eyebrow">Less searching. More driving.</span>
          <h2>
            Your plans.
            <br />
            Your perfect match.
          </h2>
          <p>
            Tell us a little about your trip. Our smart finder matches your
            preferences with the right cars in our fleet.
          </p>
          <Button asChild variant="dark">
            <Link to="/recommendations">
              <Sparkles size={17} /> Find my car
            </Link>
          </Button>
          <small>Simple preference matching. No trained AI involved.</small>
        </div>
      </section>
      <section className="section container how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="eyebrow">From a plan to a set of keys</span>
            <h2>Less hassle. More horizon.</h2>
          </div>
        </div>
        <div className="steps">
          {[
            [
              CarFront,
              "Find your drive",
              "Explore the fleet or let our smart finder narrow it down.",
            ],
            [
              CalendarCheck,
              "Make it yours",
              "Choose your dates and see your full price up front.",
            ],
            [
              KeyRound,
              "Enjoy the journey",
              "Confirm your demo reservation. Your next chapter awaits.",
            ],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof CarFront;
            return (
              <div key={String(title)}>
                <div className="step-icon">
                  <I size={25} />
                  <span>{i + 1}</span>
                </div>
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="closing-banner container">
        <div>
          <ShieldCheck size={27} />
          <h2>
            A day out. A month away.
            <br />
            Make the road your own.
          </h2>
        </div>
        <Button asChild>
          <Link to="/cars">Find your next drive</Link>
        </Button>
      </section>
    </>
  );
}
