import type { Booking, BookingStatus, Car, RentalPeriod } from "../types";
import { canBook, canTransition, priceRental } from "../utils/rental";
export function readStore<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
export const bookingService = {
  list: () => readStore<Booking[]>("driverent-bookings-v1", []),
  create(
    car: Car,
    p: RentalPeriod,
    location: string,
    existing: Booking[],
  ): Booking {
    if (!canBook(car, p, existing))
      throw new Error(
        "This car is unavailable for these dates. Choose another period.",
      );
    return {
      ...p,
      id: crypto.randomUUID(),
      carId: car.id,
      total: priceRental(car, p).total,
      status: "Upcoming",
      location,
    };
  },
  transition(b: Booking, status: BookingStatus) {
    if (!canTransition(b.status, status))
      throw new Error("This booking status cannot be changed.");
    return { ...b, status };
  },
};
