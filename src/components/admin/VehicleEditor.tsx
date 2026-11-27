import type { Dispatch, SetStateAction } from "react";
import type { Car, Category } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/ConfirmDialog";
interface Props {
  editing: Car | null;
  setEditing: Dispatch<SetStateAction<Car | null>>;
  error: string;
  setError: (message: string) => void;
  saveCar: (car: Car) => void;
  onSaved: () => void;
}
export function VehicleEditor({
  editing,
  setEditing,
  error,
  setError,
  saveCar,
  onSaved,
}: Props) {
  return (
    <Modal
      open={!!editing}
      onOpenChange={(v) => {
        if (!v) setEditing(null);
      }}
      title={editing?.id ? "Edit vehicle" : "Add a vehicle"}
      description="Update the local demonstration fleet. Use illustrative photos provided with this project."
    >
      {editing && (
        <form
          className="vehicle-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !editing.brand.trim() ||
              !editing.model.trim() ||
              !Number.isFinite(editing.dailyPrice) ||
              editing.dailyPrice <= 0
            ) {
              setError("Enter a brand, model and positive daily price.");
              return;
            }
            saveCar({
              ...editing,
              brand: editing.brand.trim(),
              model: editing.model.trim(),
              id: editing.id || crypto.randomUUID(),
            });
            setEditing(null);
            onSaved();
          }}
        >
          <div className="form-grid">
            <label>
              Brand
              <input
                required
                value={editing.brand}
                onChange={(e) =>
                  setEditing({ ...editing, brand: e.target.value })
                }
              />
            </label>
            <label>
              Model
              <input
                required
                value={editing.model}
                onChange={(e) =>
                  setEditing({ ...editing, model: e.target.value })
                }
              />
            </label>
            <label>
              Year
              <input
                required
                type="number"
                min="2000"
                max={new Date().getFullYear() + 1}
                value={editing.year}
                onChange={(e) =>
                  setEditing({ ...editing, year: +e.target.value })
                }
              />
            </label>
            <label>
              Class
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    category: e.target.value as Category,
                  })
                }
              >
                {["Economy", "Comfort", "SUV", "Premium"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Daily price (₸)
              <input
                required
                type="number"
                min="1"
                value={editing.dailyPrice}
                onChange={(e) =>
                  setEditing({ ...editing, dailyPrice: +e.target.value })
                }
              />
            </label>
            <label>
              Passengers
              <input
                required
                type="number"
                min="1"
                max="9"
                value={editing.passengers}
                onChange={(e) =>
                  setEditing({ ...editing, passengers: +e.target.value })
                }
              />
            </label>
            <label>
              Transmission
              <select
                value={editing.transmission}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    transmission: e.target.value as Car["transmission"],
                  })
                }
              >
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </label>
            <label>
              Fuel
              <select
                value={editing.fuel}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    fuel: e.target.value as Car["fuel"],
                  })
                }
              >
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Hybrid</option>
              </select>
            </label>
          </div>
          <label>
            Description
            <textarea
              required
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
          </label>
          <label>
            Illustrative photograph
            <select
              value={editing.images[0]}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  images: [e.target.value, "/images/interior.jpg"],
                })
              }
            >
              {["camry", "bmw", "suv", "mercedes"].map((x) => (
                <option value={`/images/${x}.jpg`} key={x}>
                  {x} collection
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={editing.available}
              onChange={(e) =>
                setEditing({ ...editing, available: e.target.checked })
              }
            />
            Available for booking
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <Button type="submit">Save vehicle</Button>
        </form>
      )}
    </Modal>
  );
}
