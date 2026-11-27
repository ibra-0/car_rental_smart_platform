export type Category = "Economy" | "Comfort" | "SUV" | "Premium";
export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: Category;
  description: string;
  transmission: "Automatic" | "Manual";
  fuel: "Petrol" | "Diesel" | "Hybrid";
  passengers: number;
  dailyPrice: number;
  monthlyDiscount: number;
  images: string[];
  available: boolean;
  features: string[];
}
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface RentalPeriod {
  start: string;
  end: string;
}
export type BookingStatus = "Upcoming" | "Active" | "Completed" | "Cancelled";
export interface Booking extends RentalPeriod {
  id: string;
  carId: string;
  total: number;
  status: BookingStatus;
  location: string;
}
export interface RecommendationRequest {
  budget: number;
  budgetType: "daily" | "total";
  days: number;
  passengers: number;
  category: string;
  transmission: string;
  purpose: string;
}
export interface RecommendationResult {
  car: Car;
  score: number;
  reasons: string[];
}
export interface Filters {
  query: string;
  brand: string;
  category: string;
  maxPrice: number;
  transmission: string;
  fuel: string;
  availability: string;
  sort: string;
  start?: string;
  end?: string;
}
