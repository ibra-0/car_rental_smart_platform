import type { Filters } from "../types";

/** The URL is the single source of truth for shareable catalog state. */
export function parseCatalogFilters(params: URLSearchParams): Filters {
  const price = Number(params.get("maxPrice") ?? 100000);
  return {
    query: params.get("query") || "",
    brand: params.get("brand") || "",
    category: params.get("category") || "",
    maxPrice:
      Number.isFinite(price) && price >= 14000 && price <= 100000
        ? price
        : 100000,
    transmission: params.get("transmission") || "",
    fuel: params.get("fuel") || "",
    availability: params.get("availability") || "",
    sort: ["price-asc", "price-desc"].includes(params.get("sort") || "")
      ? params.get("sort")!
      : "relevance",
    start: params.get("start") || undefined,
    end: params.get("end") || undefined,
  };
}

export function updateCatalogParam(
  params: URLSearchParams,
  key: keyof Filters,
  value: Filters[keyof Filters],
) {
  const next = new URLSearchParams(params);
  if (
    value === "" ||
    value === undefined ||
    (key === "sort" && value === "relevance") ||
    (key === "maxPrice" && value === 100000)
  )
    next.delete(key);
  else next.set(key, String(value));
  return next;
}

export function clearRentalDates(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  for (const key of ["start", "end", "term"]) next.delete(key);
  return next;
}
