import type { Booking, BookingStatus, Car, RentalPeriod } from "../types";
export const money = (n: number) =>
  new Intl.NumberFormat("en-KZ", { maximumFractionDigits: 0 }).format(n) + " ₸";
export const localDate = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const defaultPeriod = (): RentalPeriod => ({
  start: localDate(1) + "T10:00",
  end: localDate(4) + "T10:00",
});
export function validateDates(p: RentalPeriod, now = Date.now()): string {
  const a = new Date(p.start).getTime(),
    b = new Date(p.end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b))
    return "Choose valid pickup and return dates.";
  if (a < now) return "Pickup must be in the future.";
  if (b <= a) return "Return must be after pickup.";
  return "";
}
export function rentalHours(p: RentalPeriod) {
  return Math.max(
    0,
    (new Date(p.end).getTime() - new Date(p.start).getTime()) / 3600000,
  );
}
export function priceRental(car: Car, p: RentalPeriod) {
  const hours = rentalHours(p);
  if (!Number.isFinite(hours) || hours <= 0 || car.dailyPrice < 0)
    throw new Error("Invalid rental price or period.");
  const days = Math.ceil(hours / 24);
  const base =
    hours <= 6
      ? (Math.ceil(hours) * car.dailyPrice) / 6
      : days * car.dailyPrice;
  const discount = hours >= 720 ? Math.round(base * car.monthlyDiscount) : 0;
  return {
    hours,
    days,
    base: Math.round(base),
    discount,
    total: Math.round(base) - discount,
  };
}
export function overlaps(p: RentalPeriod, b: RentalPeriod) {
  return (
    new Date(p.start) < new Date(b.end) && new Date(p.end) > new Date(b.start)
  );
}
export function canBook(car: Car, p: RentalPeriod, bookings: Booking[]) {
  return (
    car.available &&
    !validateDates(p) &&
    !bookings.some(
      (b) => b.carId === car.id && b.status !== "Cancelled" && overlaps(p, b),
    )
  );
}
export function canTransition(from: BookingStatus, to: BookingStatus) {
  return (
    {
      Upcoming: ["Active", "Cancelled"],
      Active: ["Completed"],
      Completed: [],
      Cancelled: [],
    } as Record<BookingStatus, BookingStatus[]>
  )[from].includes(to);
}
export function validateCustomer(name: string, email: string) {
  return name.trim().length < 2
    ? "Enter your full name."
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Enter a valid email address."
      : "";
}
