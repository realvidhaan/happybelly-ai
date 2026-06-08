import { addDays, daysBetween, todayStr } from "./date";
import type { Meal, Profile, WeightLog } from "./types";
import { sumMeals, staticTdee } from "./nutrition";

// ~7700 kcal per kg of body mass (the classic energy-balance constant).
const KCAL_PER_KG = 7700;

export type AdaptiveTdee = {
  // Best estimate of true maintenance calories.
  tdee: number;
  // "low" | "medium" | "high" based on how much data backed the estimate.
  confidence: "none" | "low" | "medium" | "high";
  // Weight trend over the window, kg/week (negative = losing).
  weightTrendKgPerWeek: number;
  // Average daily intake actually logged in the window.
  avgIntake: number;
  loggedDays: number;
  weightSamples: number;
  // Static fallback (Mifflin–St Jeor × activity) for comparison / cold start.
  staticEstimate: number;
  usedFallback: boolean;
};

// Least-squares slope of weight vs. day-index → kg per day.
function weightSlopePerDay(points: { x: number; y: number }[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Adaptive TDEE from the rolling window:
 *   trueTDEE ≈ averageIntake − (weightChangePerDay × 7700)
 *
 * If weight is rising on a given intake, maintenance must be below that intake;
 * if it's falling, maintenance is above it. We regress weight over the window for
 * stability and average actual logged intake over the same span.
 */
export function computeAdaptiveTdee(
  meals: Meal[],
  weightLogs: WeightLog[],
  profile: Profile,
  windowDays = 7
): AdaptiveTdee {
  const staticEstimate = staticTdee(profile);
  const today = todayStr();
  const windowStart = addDays(today, -(windowDays - 1));

  // --- Intake side: average kcal across days that actually have logged meals ---
  const intakeByDay = new Map<string, number>();
  for (const meal of meals) {
    if (meal.date < windowStart || meal.date > today) continue;
    const cals = sumMeals([meal]).calories;
    intakeByDay.set(meal.date, (intakeByDay.get(meal.date) ?? 0) + cals);
  }
  const loggedDays = intakeByDay.size;
  const avgIntake =
    loggedDays > 0
      ? Math.round([...intakeByDay.values()].reduce((a, b) => a + b, 0) / loggedDays)
      : 0;

  // --- Weight side: regress weight within the window (relative day index) ---
  const winWeights = weightLogs
    .filter((w) => w.date >= windowStart && w.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const points = winWeights.map((w) => ({
    x: daysBetween(windowStart, w.date),
    y: w.weightKg,
  }));
  const slopePerDay = weightSlopePerDay(points);
  const weightTrendKgPerWeek = Math.round(slopePerDay * 7 * 100) / 100;

  // Need both real intake and a weight trend (≥2 weigh-ins) for an adaptive number.
  const haveAdaptive = loggedDays >= 3 && points.length >= 2;

  if (!haveAdaptive) {
    return {
      tdee: staticEstimate,
      confidence: "none",
      weightTrendKgPerWeek,
      avgIntake,
      loggedDays,
      weightSamples: points.length,
      staticEstimate,
      usedFallback: true,
    };
  }

  const dailyBalance = slopePerDay * KCAL_PER_KG; // kcal/day surplus(+)/deficit(−)
  const adaptive = Math.round(avgIntake - dailyBalance);

  // Confidence scales with both data density and the weigh-in span.
  const span = points.length ? points[points.length - 1].x - points[0].x : 0;
  let confidence: AdaptiveTdee["confidence"] = "low";
  if (loggedDays >= 6 && points.length >= 4 && span >= 5) confidence = "high";
  else if (loggedDays >= 5 && points.length >= 3) confidence = "medium";

  // Guard against absurd outputs from sparse/noisy weight data.
  const clamped = Math.min(
    Math.round(staticEstimate * 1.6),
    Math.max(Math.round(staticEstimate * 0.6), adaptive)
  );

  return {
    tdee: clamped,
    confidence,
    weightTrendKgPerWeek,
    avgIntake,
    loggedDays,
    weightSamples: points.length,
    staticEstimate,
    usedFallback: false,
  };
}
