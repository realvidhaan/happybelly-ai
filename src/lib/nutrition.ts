import type {
  ActivityLevel,
  FoodItem,
  Goal,
  MacroSet,
  Meal,
  Profile,
} from "./types";

export function emptyMacros(): MacroSet {
  return { calories: 0, protein: 0, carbs: 0, fats: 0 };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function sumItems(items: { calories: number; protein: number; carbs: number; fats: number }[]): MacroSet {
  return items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      protein: acc.protein + (it.protein || 0),
      carbs: acc.carbs + (it.carbs || 0),
      fats: acc.fats + (it.fats || 0),
    }),
    emptyMacros()
  );
}

export function sumMeals(meals: Meal[]): MacroSet {
  return meals.reduce((acc, m) => {
    const t = sumItems(m.items);
    return {
      calories: acc.calories + t.calories,
      protein: acc.protein + t.protein,
      carbs: acc.carbs + t.carbs,
      fats: acc.fats + t.fats,
    };
  }, emptyMacros());
}

export function scaleItem(item: FoodItem, factor: number): FoodItem {
  return {
    ...item,
    grams: round1(item.grams * factor),
    calories: Math.round(item.calories * factor),
    protein: round1(item.protein * factor),
    carbs: round1(item.carbs * factor),
    fats: round1(item.fats * factor),
  };
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little/no exercise)",
  light: "Light (1–3 days/week)",
  moderate: "Moderate (3–5 days/week)",
  active: "Active (6–7 days/week)",
  very_active: "Very active (athlete / physical job)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Lose weight",
  maintain: "Maintain",
  gain: "Gain weight",
};

// Mifflin–St Jeor basal metabolic rate.
export function bmr(profile: Pick<Profile, "sex" | "weightKg" | "heightCm" | "age">): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return profile.sex === "male" ? base + 5 : base - 161;
}

// Baseline maintenance estimate from body stats (before adaptive correction).
export function staticTdee(profile: Profile): number {
  return Math.round(bmr(profile) * ACTIVITY_FACTORS[profile.activity]);
}

const GOAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 350,
};

// Derive macro targets from body stats. Protein scales with bodyweight, fats take
// ~27% of calories, carbs fill the rest.
export function computeAutoTargets(profile: Profile): MacroSet {
  const calories = Math.max(1200, Math.round(staticTdee(profile) + GOAL_DELTA[profile.goal]));
  const proteinPerKg = profile.goal === "maintain" ? 1.8 : 2.0;
  const protein = Math.round(profile.weightKg * proteinPerKg);
  const fats = Math.round((calories * 0.27) / 9);
  const remaining = calories - (protein * 4 + fats * 9);
  const carbs = Math.max(0, Math.round(remaining / 4));
  return { calories, protein, carbs, fats };
}

export function resolveTargets(profile: Profile): MacroSet {
  return profile.useAutoTargets ? computeAutoTargets(profile) : profile.targets;
}

export function pctOf(actual: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(999, Math.round((actual / target) * 100));
}

// Energy contributed by each macro, for the "where my calories came from" split.
export function calorieSplit(m: MacroSet): { protein: number; carbs: number; fats: number } {
  return {
    protein: Math.round(m.protein * 4),
    carbs: Math.round(m.carbs * 4),
    fats: Math.round(m.fats * 9),
  };
}

// kg <-> lb helpers for the imperial unit toggle.
export const KG_PER_LB = 0.45359237;
export function kgToLb(kg: number): number {
  return round1(kg / KG_PER_LB);
}
export function lbToKg(lb: number): number {
  return round1(lb * KG_PER_LB);
}
