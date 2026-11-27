import { VehicleEditor } from "../components/admin/VehicleEditor";
import { useState } from "react";
import {
  CarFront,
  CalendarDays,
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Wallet,
  Search,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Car, BookingStatus } from "../types";
import { money, canTransition } from "../utils/rental";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, StatusBadge } from "../components/Common";
const blank: Car = {
  id: "",
  brand: "",
  model: "",
  year: 2026,
  category: "Comfort",
  description: "A comfortable, capable choice for your next journey.",
  transmission: "Automatic",
  fuel: "Petrol",
  passengers: 5,
  dailyPrice: 25000,
  monthlyDiscount: 0.2,
  available: true,
  images: ["/images/camry.jpg", "/images/interior.jpg"],
  features: ["Air conditioning", "Bluetooth audio", "USB charging"],
};
export default function Admin() {
  const { cars, bookings, saveCar, deleteCar, changeStatus } = useApp();
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState<Car | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const stats = [
    { label: "Vehicles in fleet", value: String(cars.length), Icon: CarFront },
    {
      label: "Available vehicles",
      value: String(cars.filter((c) => c.available).length),
      Icon: CheckCircle2,
    },
    {
      label: "Demo reservations",
      value: String(bookings.length),
      Icon: CalendarDays,
    },
    {
      label: "Booked value (demo)",
      value: money(
        bookings
          .filter((b) => b.status !== "Cancelled")
          .reduce((s, b) => s + b.total, 0),
      ),
      Icon: Wallet,
    },
  ];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <span className="eyebrow">DriveRent workspace</span>
        <h2>Fleet, in focus.</h2>
        {[
          ["Overview", LayoutDashboard],
          ["Vehicles", CarFront],
          ["Bookings", CalendarDays],
        ].map(([name, Icon]) => {
          const I = Icon as typeof CarFront;
          return (
            <button
              className={tab === name ? "active" : ""}
              key={String(name)}
              onClick={() => setTab(String(name))}
            >
              <I size={19} />
              {String(name)}
            </button>
          );
        })}
        <div className="admin-sidebar-note">
          Demo administration
          <p>
            Changes apply to this browser only. This interface provides no real
            authentication or security.
          </p>
        </div>
      </aside>
      <div className="admin-content">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A clearer view of your operation</span>
            <h1>
              {tab === "Overview"
                ? "At a glance."
                : tab === "Vehicles"
                  ? "Manage your fleet."
                  : "Every reservation."}
            </h1>
            <p>Demonstration workspace · Almaty, Kazakhstan</p>
          </div>
          {tab !== "Bookings" && (
            <Button
              onClick={() => {
                setEditing({ ...blank });
                setError("");
              }}
            >
              <Plus size={17} /> Add vehicle
            </Button>
          )}
        </div>
        {notice && (
          <div role="status" className="notice">
            {notice}
          </div>
        )}
        {tab === "Overview" && (
          <>
            <div className="stats-grid">
              {stats.map(({ label, value, Icon }) => (
                <div className="stat-card" key={label}>
                  <Icon size={21} />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="admin-insights">
              <div className="form-card">
                <h3>Fleet composition</h3>
                {["Economy", "Comfort", "SUV", "Premium"].map((category) => (
                  <div className="bar-row" key={category}>
                    <span>{category}</span>
                    <div className="bar-track">
                      <div
                        style={{
                          width: `${(cars.filter((c) => c.category === category).length / Math.max(cars.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>
                      {cars.filter((c) => c.category === category).length}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="form-card">
                <h3>Reservation activity</h3>
                {["Upcoming", "Active", "Completed", "Cancelled"].map((s) => (
                  <div className="row between activity-row" key={s}>
                    <StatusBadge value={s} />
                    <strong>
                      {bookings.filter((b) => b.status === s).length}
                    </strong>
                  </div>
                ))}
                <small>
                  Calculated from this browser’s actual demo records.
                </small>
              </div>
            </div>
          </>
        )}
        {tab !== "Bookings" && (
          <section className="table-card">
            <div className="table-heading">
              <h2>
                {tab === "Overview" ? "Your fleet" : "Vehicle management"}
              </h2>
              <label className="search-input">
                <Search size={17} />
                <input
                  aria-label="Search fleet"
                  placeholder="Search fleet…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Class</th>
                    <th>Daily rate</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cars
                    .filter((c) =>
                      (c.brand + " " + c.model)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="table-vehicle">
                            <img src={c.images[0]} alt="" />
                            <div>
                              <strong>
                                {c.brand} {c.model}
                              </strong>
                              <small>
                                {c.year} · {c.transmission}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{c.category}</td>
                        <td>{money(c.dailyPrice)}</td>
                        <td>
                          <button
                            className={`status ${c.available ? "available" : "reserved"}`}
                            onClick={() =>
                              saveCar({ ...c, available: !c.available })
                            }
                            aria-label={`Toggle ${c.brand} ${c.model} availability`}
                          >
                            {c.available ? "Available" : "Reserved"}
                          </button>
                        </td>
                        <td>
                          <div className="row">
                            <button
                              className="icon-button"
                              aria-label={`Edit ${c.brand} ${c.model}`}
                              onClick={() => {
                                setEditing({ ...c });
                                setError("");
                              }}
                            >
                              <Pencil size={17} />
                            </button>
                            <ConfirmDialog
                              title={`Delete ${c.brand} ${c.model}?`}
                              description="This removes the vehicle from the local demo fleet. Open reservations must be resolved first."
                              onConfirm={() => {
                                try {
                                  deleteCar(c.id);
                                  setNotice("Vehicle deleted.");
                                } catch (e) {
                                  setNotice((e as Error).message);
                                }
                              }}
                            >
                              <button
                                className="icon-button"
                                aria-label={`Delete ${c.brand} ${c.model}`}
                              >
                                <Trash2 size={17} />
                              </button>
                            </ConfirmDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "Bookings" && (
          <section className="table-card">
            <div className="table-heading">
              <h2>Booking management</h2>
              <span>{bookings.length} reservations</span>
            </div>
            {bookings.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Reservation</th>
                      <th>Vehicle</th>
                      <th>Rental period</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>#{b.id.slice(0, 8)}</td>
                        <td>
                          {cars.find((c) => c.id === b.carId)?.brand}{" "}
                          {cars.find((c) => c.id === b.carId)?.model ||
                            "Archived vehicle"}
                        </td>
                        <td>
                          <small>
                            {b.start.replace("T", " ")}
                            <br />
                            {b.end.replace("T", " ")}
                          </small>
                        </td>
                        <td>{money(b.total)}</td>
                        <td>
                          <select
                            aria-label={`Status for ${b.id.slice(0, 8)}`}
                            value={b.status}
                            onChange={(e) =>
                              changeStatus(
                                b.id,
                                e.target.value as BookingStatus,
                              )
                            }
                          >
                            {(
                              [
                                "Upcoming",
                                "Active",
                                "Completed",
                                "Cancelled",
                              ] as BookingStatus[]
                            ).map((s) => (
                              <option
                                key={s}
                                disabled={
                                  s !== b.status && !canTransition(b.status, s)
                                }
                              >
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="The road is clear."
                text="Create a demo reservation from the fleet to see it here."
              />
            )}
          </section>
        )}
      </div>
      <VehicleEditor
        editing={editing}
        setEditing={setEditing}
        error={error}
        setError={setError}
        saveCar={saveCar}
        onSaved={() => setNotice("Vehicle saved.")}
      />
    </div>
  );
}
