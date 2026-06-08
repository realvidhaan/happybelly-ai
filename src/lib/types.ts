// Shared domain types for HappyBelly AI.

export type MacroSet = {
  calories: number; // kcal
  protein: number; // g
  carbs: number; // g
  fats: number; // g
};

export type FoodItem = {
  id: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence?: number;
};

export type MealSource = "text" | "vision" | "manual";

export type Meal = {
  id: string;
  date: string; // YYYY-MM-DD (user-local)
  createdAt: string; // ISO timestamp
  title: string;
  source: MealSource;
  note?: string;
  items: FoodItem[];
};

export type WeightLog = {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
};

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export type Profile = {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  unit: "metric" | "imperial";
  useAutoTargets: boolean;
  targets: MacroSet;
};

export type CorrectionField = keyof MacroSet | "grams";

export type Correction = {
  id: string;
  foodName: string;
  field: CorrectionField;
  aiValue: number;
  userValue: number;
  createdAt: string;
};

// The shape the AI returns for a single parsed food item.
export type ParsedItem = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence?: number;
};

export type ParseResponse = {
  mealTitle: string;
  items: ParsedItem[];
  model?: string;
  notes?: string;
};
