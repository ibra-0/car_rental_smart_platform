import type {
  Car,
  RecommendationRequest,
  RecommendationResult,
} from "../types";
export function recommend(
  cars: Car[],
  r: RecommendationRequest,
): RecommendationResult[] {
  if (r.budget <= 0 || r.days < 1 || r.passengers < 1) return [];
  const limit = r.budgetType === "total" ? r.budget / r.days : r.budget;
  return cars
    .filter(
      (c) =>
        c.available &&
        c.passengers >= r.passengers &&
        c.dailyPrice * (r.days >= 30 ? 1 - c.monthlyDiscount : 1) <= limit &&
        (!r.transmission || c.transmission === r.transmission) &&
        (!r.category || c.category === r.category),
    )
    .map((car) => {
      const reasons = [
        "Fits your budget",
        `Room for ${r.passengers} passengers`,
      ];
      let score = 60;
      if (r.category === car.category) {
        score += 20;
        reasons.push("Your preferred vehicle class");
      }
      if (
        (r.purpose === "Family travel" && car.category === "SUV") ||
        (r.purpose === "Business trip" && car.category === "Comfort") ||
        (r.purpose === "Premium experience" && car.category === "Premium") ||
        (r.purpose === "City driving" && car.category === "Economy") ||
        (r.purpose === "Long-distance travel" && car.category === "SUV")
      ) {
        score += 15;
        reasons.push(`Well suited to ${r.purpose.toLowerCase()}`);
      }
      if (r.days >= 30) {
        score += 5;
        reasons.push("20% long-term discount");
      }
      return { car, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.car.dailyPrice - b.car.dailyPrice);
}
