import type { Car, Filters } from "../types";
import { overlaps } from "../utils/rental";
import { bookingService } from "./bookingService";
export function filterCars(cars: Car[], f: Filters) {
  const result = cars.filter(
    (c) =>
      (c.brand + " " + c.model).toLowerCase().includes(f.query.toLowerCase()) &&
      (!f.brand || c.brand === f.brand) &&
      (!f.category || c.category === f.category) &&
      c.dailyPrice <= f.maxPrice &&
      (!f.transmission || c.transmission === f.transmission) &&
      (!f.fuel || c.fuel === f.fuel) &&
      (!f.availability || c.available === (f.availability === "available")) &&
      (!(f.start && f.end) ||
        !bookingService
          .list()
          .some(
            (b) =>
              b.carId === c.id &&
              b.status !== "Cancelled" &&
              overlaps({ start: f.start!, end: f.end! }, b),
          )),
  );
  return f.sort === "price-asc"
    ? result.sort((a, b) => a.dailyPrice - b.dailyPrice)
    : f.sort === "price-desc"
      ? result.sort((a, b) => b.dailyPrice - a.dailyPrice)
      : result;
}
export const carService = {
  list: (cars: Car[]) => cars,
  get: (cars: Car[], id: string) => cars.find((c) => c.id === id),
};
