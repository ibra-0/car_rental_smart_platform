import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, UserRound, MapPin } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeading, EmptyState, StatusBadge } from "../components/Common";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { money } from "../utils/rental";
export default function Dashboard() {
  const { user, cars, bookings, changeStatus } = useApp();
  const [tab, setTab] = useState("All");
  const shown = bookings.filter(
    (b) =>
      tab === "All" ||
      (tab === "Previous" && ["Completed", "Cancelled"].includes(b.status)) ||
      tab === b.status,
  );
  return (
    <div className="container page">
      <PageHeading
        eyebrow="Your DriveRent"
        title={
          user
            ? `Good to see you, ${user.name.split(" ")[0]}.`
            : "Your next chapter, all here."
        }
        text="A little less admin. A little more open road."
      />
      <div className="dashboard-layout">
        <aside className="profile-card">
          <div className="avatar">
            <UserRound size={30} />
          </div>
          <h3>{user?.name || "Guest driver"}</h3>
          <p>{user?.email || "Your local demo workspace"}</p>
          <span className="status">Demo profile</span>
          <hr />
          <div className="row">
            <CalendarDays size={19} />
            {bookings.length} demo reservations
          </div>
          <p className="muted">
            Bookings are shared within this browser’s demo workspace. Real
            account ownership will be handled by the backend.
          </p>
          {!user && (
            <Button asChild variant="outline">
              <Link to="/login">Demo sign in</Link>
            </Button>
          )}
        </aside>
        <section>
          <div className="tabs" role="group" aria-label="Booking status filter">
            {["All", "Upcoming", "Active", "Previous"].map((t) => (
              <button
                className={tab === t ? "selected" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {shown.length ? (
            shown.map((b) => {
              const car = cars.find((c) => c.id === b.carId);
              return (
                <article className="booking-card" key={b.id}>
                  <img
                    src={car?.images[0] || "/images/hero.jpg"}
                    alt={
                      car
                        ? `${car.brand} ${car.model}`
                        : "Previous rental vehicle"
                    }
                  />
                  <div className="booking-card-body">
                    <div className="row between">
                      <span className="eyebrow">
                        Reservation {b.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge value={b.status} />
                    </div>
                    <h3>
                      {car ? `${car.brand} ${car.model}` : "Archived vehicle"}
                    </h3>
                    <p>
                      <CalendarDays size={15} /> {b.start.replace("T", " ")} —{" "}
                      {b.end.replace("T", " ")}
                    </p>
                    <p>
                      <MapPin size={15} /> {b.location}
                    </p>
                    <div className="row between">
                      <strong>{money(b.total)}</strong>
                      {b.status === "Upcoming" && (
                        <ConfirmDialog
                          title="Cancel this reservation?"
                          description="Your demo booking will be cancelled and these dates released."
                          onConfirm={() => changeStatus(b.id, "Cancelled")}
                        >
                          <Button variant="outline">Cancel reservation</Button>
                        </ConfirmDialog>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="A new journey is waiting."
              text="Your reservations will appear here. Find a car and make some plans."
            >
              <Button asChild>
                <Link to="/cars">Explore cars</Link>
              </Button>
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
