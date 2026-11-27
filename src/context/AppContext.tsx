import { createContext, useContext, useState, type ReactNode } from "react";
import type { Car, User, Booking, BookingStatus, RentalPeriod } from "../types";
import { initialCars } from "../data/cars";
import { bookingService, readStore } from "../services/bookingService";
interface State {
  cars: Car[];
  bookings: Booking[];
  user: User | null;
  setUser: (u: User | null) => void;
  saveCar: (c: Car) => void;
  deleteCar: (id: string) => void;
  createBooking: (c: Car, p: RentalPeriod, location: string) => Booking;
  changeStatus: (id: string, s: BookingStatus) => void;
}
const Context = createContext<State | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<Car[]>(() =>
    readStore("driverent-cars-v1", initialCars),
  );
  const [bookings, setBookings] = useState(bookingService.list);
  const [user, setUser] = useState<User | null>(null);
  function storeCars(next: Car[]) {
    localStorage.setItem("driverent-cars-v1", JSON.stringify(next));
    setCars(next);
  }
  function storeBookings(next: Booking[]) {
    localStorage.setItem("driverent-bookings-v1", JSON.stringify(next));
    setBookings(next);
  }
  return (
    <Context.Provider
      value={{
        cars,
        bookings,
        user,
        setUser,
        saveCar: (c) =>
          storeCars(
            cars.some((x) => x.id === c.id)
              ? cars.map((x) => (x.id === c.id ? c : x))
              : [...cars, c],
          ),
        deleteCar: (id) => {
          if (
            bookings.some(
              (b) =>
                b.carId === id &&
                b.status !== "Cancelled" &&
                b.status !== "Completed",
            )
          )
            throw new Error(
              "Cancel or complete open reservations before deleting this vehicle.",
            );
          storeCars(cars.filter((c) => c.id !== id));
        },
        createBooking: (c, p, l) => {
          const b = bookingService.create(c, p, l, bookingService.list());
          storeBookings([...bookingService.list(), b]);
          return b;
        },
        changeStatus: (id, s) =>
          storeBookings(
            bookings.map((b) =>
              b.id === id ? bookingService.transition(b, s) : b,
            ),
          ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("App provider is missing");
  return context;
}
