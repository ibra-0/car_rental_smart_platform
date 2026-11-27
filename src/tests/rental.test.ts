import { describe, it, expect } from "vitest";
import { initialCars } from "../data/cars";
import {
  rentalHours,
  priceRental,
  validateDates,
  overlaps,
  canBook,
  canTransition,
  validateCustomer,
} from "../utils/rental";
import { filterCars } from "../services/carService";
import { recommend } from "../services/recommendationService";
import { bookingService } from "../services/bookingService";
import { authService } from "../services/authService";
import type { Booking, Filters } from "../types";
const car = initialCars[0],
  period = { start: "2099-01-01T10:00", end: "2099-01-04T10:00" };
const filters: Filters = {
  query: "",
  brand: "",
  category: "",
  maxPrice: 100000,
  transmission: "",
  fuel: "",
  availability: "",
  sort: "relevance",
};
const booking: Booking = {
  ...period,
  id: "test",
  carId: car.id,
  total: 75000,
  status: "Upcoming",
  location: "Almaty city centre",
};
describe("rental pricing", () => {
  it("calculates rental hours and a three-day rental", () => {
    expect(rentalHours(period)).toBe(72);
    expect(priceRental(car, period)).toMatchObject({
      days: 3,
      base: 75000,
      discount: 0,
      total: 75000,
    });
  });
  it("bills each started hour up to six hours", () => {
    expect(priceRental(car, { ...period, end: "2099-01-01T11:01" }).total).toBe(
      8333,
    );
    expect(priceRental(car, { ...period, end: "2099-01-01T16:00" }).total).toBe(
      25000,
    );
  });
  it("rounds partial days up after six hours", () =>
    expect(priceRental(car, { ...period, end: "2099-01-02T10:01" }).total).toBe(
      50000,
    ));
  it("discounts exactly 30 full days by 20 percent", () =>
    expect(
      priceRental(car, { ...period, end: "2099-01-31T10:00" }),
    ).toMatchObject({ base: 750000, discount: 150000, total: 600000 }));
  it("does not discount a partial 30th day", () =>
    expect(
      priceRental(car, { ...period, end: "2099-01-31T09:59" }).discount,
    ).toBe(0));
  it("rejects zero, negative, and malformed periods", () => {
    for (const end of [period.start, "2098-01-01T10:00", "bad"])
      expect(() => priceRental(car, { ...period, end })).toThrow();
    expect(() => priceRental({ ...car, dailyPrice: -10 }, period)).toThrow();
  });
});
describe("date validation and availability", () => {
  it("rejects malformed, past and reversed dates", () => {
    expect(validateDates({ start: "bad", end: "bad" })).not.toBe("");
    expect(validateDates({ start: "2000-01-01", end: "2000-01-02" })).toContain(
      "future",
    );
    expect(validateDates({ ...period, end: period.start })).toContain("after");
    expect(validateDates(period)).toBe("");
  });
  it("allows adjacent reservations but catches containment and intersection", () => {
    expect(
      overlaps(period, { start: period.end, end: "2099-01-05T10:00" }),
    ).toBe(false);
    expect(overlaps(period, { start: "2099-01-02", end: "2099-01-03" })).toBe(
      true,
    );
    expect(overlaps(period, { start: "2098-12-31", end: "2099-02-01" })).toBe(
      true,
    );
  });
  it("blocks unavailable cars and overlapping live bookings", () => {
    expect(canBook({ ...car, available: false }, period, [])).toBe(false);
    expect(canBook(car, period, [booking])).toBe(false);
    expect(canBook(car, period, [{ ...booking, status: "Cancelled" }])).toBe(
      true,
    );
    expect(() =>
      bookingService.create(car, period, "Almaty", [booking]),
    ).toThrow("unavailable");
  });
});
describe("catalog", () => {
  it("combines text, brand, category, price, fuel and availability filters", () => {
    const result = filterCars(initialCars, {
      ...filters,
      query: "CAM",
      brand: "Toyota",
      category: "Comfort",
      maxPrice: 26000,
      fuel: "Petrol",
      transmission: "Automatic",
      availability: "available",
    });
    expect(result.map((c) => c.id)).toEqual(["1"]);
  });
  it("sorts prices both ways without mutating source", () => {
    const before = initialCars.map((c) => c.id);
    const asc = filterCars(initialCars, { ...filters, sort: "price-asc" });
    expect(asc[0].dailyPrice).toBe(14000);
    expect(
      filterCars(initialCars, { ...filters, sort: "price-desc" })[0].dailyPrice,
    ).toBe(65000);
    expect(initialCars.map((c) => c.id)).toEqual(before);
  });
  it("returns an empty state for no match", () =>
    expect(filterCars(initialCars, { ...filters, query: "spaceship" })).toEqual(
      [],
    ));
});
describe("recommendations", () => {
  const request = {
    budget: 70000,
    budgetType: "daily" as const,
    days: 3,
    passengers: 5,
    category: "",
    transmission: "Automatic",
    purpose: "Family travel",
  };
  it("ranks purpose matches first and explains them", () => {
    const results = recommend(initialCars, request);
    expect(results[0].car.category).toBe("SUV");
    expect(results[0].reasons).toContain("Well suited to family travel");
    expect(recommend(initialCars, request)).toEqual(results);
  });
  it("respects total budget, availability, capacity and transmission", () => {
    const results = recommend(initialCars, {
      ...request,
      budget: 75000,
      budgetType: "total",
    });
    expect(
      results.every(
        (r) =>
          r.car.dailyPrice <= 25000 &&
          r.car.available &&
          r.car.passengers >= 5 &&
          r.car.transmission === "Automatic",
      ),
    ).toBe(true);
  });
  it("accounts for monthly savings and rejects impossible requests", () => {
    expect(
      recommend([car], {
        ...request,
        budget: 600000,
        budgetType: "total",
        days: 30,
      }),
    ).toHaveLength(1);
    expect(recommend(initialCars, { ...request, passengers: 9 })).toEqual([]);
    expect(recommend(initialCars, { ...request, days: 0 })).toEqual([]);
  });
});
describe("status and forms", () => {
  it("enforces the booking state machine", () => {
    expect(canTransition("Upcoming", "Cancelled")).toBe(true);
    expect(canTransition("Active", "Completed")).toBe(true);
    expect(canTransition("Cancelled", "Upcoming")).toBe(false);
    expect(() =>
      bookingService.transition(
        { ...booking, status: "Completed" },
        "Cancelled",
      ),
    ).toThrow();
  });
  it("validates customer names and emails", () => {
    expect(validateCustomer("A", "a@example.com")).toContain("name");
    expect(validateCustomer("Alex", "not-email")).toContain("email");
    expect(validateCustomer("Alex Driver", "alex@example.com")).toBe("");
  });
  it("validates demo credentials without persisting them", () => {
    expect(() => authService.signIn("Alex", "a@example.com", "short")).toThrow(
      "8 characters",
    );
    expect(authService.signIn("Alex", "a@example.com", "fictional123")).toEqual(
      { id: "demo-customer", name: "Alex", email: "a@example.com" },
    );
  });
});
