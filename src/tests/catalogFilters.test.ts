import { describe, it, expect } from "vitest";
import {
  parseCatalogFilters,
  updateCatalogParam,
  clearRentalDates,
} from "../utils/catalogFilters";

describe("catalog URL state", () => {
  it("restores filters and rental dates from a shared URL", () => {
    expect(
      parseCatalogFilters(
        new URLSearchParams(
          "brand=Toyota&category=SUV&query=Land&maxPrice=70000&sort=price-desc&start=2099-01-01T10:00&end=2099-01-03T10:00",
        ),
      ),
    ).toMatchObject({
      brand: "Toyota",
      category: "SUV",
      query: "Land",
      maxPrice: 70000,
      sort: "price-desc",
      start: "2099-01-01T10:00",
      end: "2099-01-03T10:00",
    });
  });
  it("rejects malformed budgets and unsupported sorting values", () => {
    for (const value of ["NaN", "-1", "Infinity", "200000"])
      expect(
        parseCatalogFilters(
          new URLSearchParams({ maxPrice: value, sort: "bad" }),
        ),
      ).toMatchObject({ maxPrice: 100000, sort: "relevance" });
  });
  it("updates one filter without losing the trip or modifying the original URL", () => {
    const original = new URLSearchParams("start=2099-01-01&brand=Toyota");
    const next = updateCatalogParam(original, "category", "SUV");
    expect(next.get("category")).toBe("SUV");
    expect(next.get("start")).toBe("2099-01-01");
    expect(original.has("category")).toBe(false);
    expect(updateCatalogParam(next, "brand", "").has("brand")).toBe(false);
  });
  it("clears dates while keeping the selected filters and location", () => {
    const result = clearRentalDates(
      new URLSearchParams(
        "start=2099-01-01&end=2099-01-03&term=long&brand=Toyota&category=SUV&location=Airport",
      ),
    );
    expect([...result.keys()]).toEqual(["brand", "category", "location"]);
  });
});
