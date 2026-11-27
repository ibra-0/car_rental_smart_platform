import { localDate } from "../utils/rental";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, MapPin, CarFront, Globe, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Button } from "./ui/Button";
export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="DriveRent home">
      <span className="logo-mark">
        <CarFront size={23} strokeWidth={2} />
      </span>
      Drive<span>Rent</span>
      <span className="logo-period">.</span>
    </Link>
  );
}
export function Layout() {
  const [open, setOpen] = useState(false);
  const { user, setUser } = useApp();
  const location = useLocation();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header>
        <div className="container header-inner">
          <Logo />
          <nav
            aria-label="Main navigation"
            className={open ? "nav open" : "nav"}
          >
            <NavLink to="/" end onClick={() => setOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/cars" onClick={() => setOpen(false)}>
              Explore cars
            </NavLink>
            <NavLink to="/recommendations" onClick={() => setOpen(false)}>
              Smart finder <span className="tiny-badge">Try it</span>
            </NavLink>
            <NavLink to="/dashboard" onClick={() => setOpen(false)}>
              My bookings
            </NavLink>
          </nav>
          <div className="header-actions">
            <span className="location">
              <MapPin size={15} /> Almaty, KZ <ChevronDown size={13} />
            </span>
            {user ? (
              <Button variant="outline" onClick={() => setUser(null)}>
                Sign out
              </Button>
            ) : (
              <Button asChild variant="dark">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
            <button
              className="icon-button mobile-menu"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" key={location.pathname}>
        <Outlet />
      </main>
      <footer>
        <div className="container">
          <div className="footer-main">
            <div>
              <Logo />
              <p>
                A better car. A better journey.
                <br />
                Your next chapter starts here.
              </p>
              <span className="footer-place">
                <MapPin size={15} /> Almaty, Kazakhstan
              </span>
            </div>
            <div>
              <h4>On the road</h4>
              <Link to="/cars">Explore our fleet</Link>
              <Link
                to={`/cars?${new URLSearchParams({ term: "long", start: localDate(1) + "T10:00", end: localDate(31) + "T10:00" })}`}
              >
                Long-term rental
              </Link>
              <Link to="/recommendations">Find your match</Link>
            </div>
            <div>
              <h4>Your DriveRent</h4>
              <Link to="/dashboard">My bookings</Link>
              <Link to="/login">Sign in</Link>
              <Link to="/admin">Demo administration</Link>
            </div>
            <div>
              <h4>Made for your next move.</h4>
              <p>
                A university project exploring a<br />
                smarter way to rent.
              </p>
              <Globe size={20} />
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} DriveRent. University demo.
            </span>
            <span>Fictional prices. No real bookings or payments.</span>
            <span>Designed in Almaty</span>
          </div>
        </div>
      </footer>
    </>
  );
}
