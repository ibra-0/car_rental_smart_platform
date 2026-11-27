import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Filters } from "../types";
import { useApp } from "../context/AppContext";
import { filterCars } from "../services/carService";
import { CarGrid, EmptyState, PageHeading } from "../components/Common";
import { Button } from "../components/ui/Button";
import { money, validateDates } from "../utils/rental";
import {
  parseCatalogFilters,
  updateCatalogParam,
  clearRentalDates,
} from "../utils/catalogFilters";
export default function Catalog() {
  const { cars } = useApp();
  const [params, setParams] = useSearchParams();
  const [mobile, setMobile] = useState(false);
  const filters = parseCatalogFilters(params);
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setParams((current) => updateCatalogParam(current, key, value), {
      replace: true,
    });
  }
  const result = filterCars(cars, filters);
  const periodQuery = new URLSearchParams();
  for (const key of ["start", "end", "location", "term"]) {
    const value = params.get(key);
    if (value) periodQuery.set(key, value);
  }
  const query = periodQuery.size ? "?" + periodQuery : "";
  const dateError =
    filters.start && filters.end
      ? validateDates({ start: filters.start, end: filters.end })
      : "";
  return (
    <div className="container page">
      <PageHeading
        eyebrow="The DriveRent collection"
        title="Find your kind of freedom."
        text="City errands, mountain air, or a new routine. There’s a drive for that."
      />
      <div className="catalog-toolbar">
        <label className="search-input">
          <Search size={19} />
          <input
            aria-label="Search vehicles"
            placeholder="Search by brand or model…"
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
          />
        </label>
        <Button
          variant="outline"
          className="filter-toggle"
          aria-controls="catalog-filters"
          aria-expanded={mobile}
          onClick={() => setMobile(!mobile)}
        >
          <SlidersHorizontal size={17} /> Filters
        </Button>
        <label className="sort-label">
          Sort by
          <select
            aria-label="Sort vehicles"
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="relevance">Recommended</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>
      {params.get("start") && (
        <div className="notice">
          Your trip: {params.get("start")?.replace("T", " ")} —{" "}
          {params.get("end")?.replace("T", " ")} ·{" "}
          {params.get("location") || "Almaty city centre"}{" "}
          <button
            className="text-link"
            onClick={() => {
              setParams((current) => clearRentalDates(current), {
                replace: true,
              });
            }}
          >
            Clear dates
          </button>
        </div>
      )}
      {dateError && (
        <p role="alert" className="error">
          {dateError}
        </p>
      )}
      <div className="catalog-layout">
        <aside
          id="catalog-filters"
          className={mobile ? "filter-panel show" : "filter-panel"}
        >
          <div className="row between">
            <h3>Refine your drive</h3>
            <button
              className="icon-button filter-toggle"
              onClick={() => setMobile(false)}
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>
          <label>
            Brand
            <select
              value={filters.brand}
              onChange={(e) => update("brand", e.target.value)}
            >
              <option value="">All brands</option>
              {[...new Set(cars.map((c) => c.brand))].sort().map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Vehicle class
            <select
              value={filters.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All classes</option>
              {["Economy", "Comfort", "SUV", "Premium"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Daily budget{" "}
            <span className="range-value">Up to {money(filters.maxPrice)}</span>
            <input
              type="range"
              min="14000"
              max="100000"
              step="1000"
              value={filters.maxPrice}
              onChange={(e) => update("maxPrice", +e.target.value)}
            />
          </label>
          <label>
            Transmission
            <select
              value={filters.transmission}
              onChange={(e) => update("transmission", e.target.value)}
            >
              <option value="">Any transmission</option>
              <option>Automatic</option>
              <option>Manual</option>
            </select>
          </label>
          <label>
            Fuel type
            <select
              value={filters.fuel}
              onChange={(e) => update("fuel", e.target.value)}
            >
              <option value="">Any fuel</option>
              <option>Petrol</option>
              <option>Diesel</option>
              <option>Hybrid</option>
            </select>
          </label>
          <label>
            Availability
            <select
              value={filters.availability}
              onChange={(e) => update("availability", e.target.value)}
            >
              <option value="">All vehicles</option>
              <option value="available">Available now</option>
              <option value="reserved">Currently reserved</option>
            </select>
          </label>
          <Button
            variant="outline"
            onClick={() => {
              setParams({});
            }}
          >
            Reset filters
          </Button>
          <div className="filter-note">
            A longer stay?<p>Save 20% on rentals of 30 days or more.</p>
          </div>
        </aside>
        <div>
          <div className="results-line">
            <span>
              <strong>{result.length}</strong> vehicles for your next chapter
            </span>
            <span>Prices per day · KZT</span>
          </div>
          {result.length ? (
            <CarGrid cars={result} query={query} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
