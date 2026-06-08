import type { Meal, WeightLog } from "./types";
import { loggedDaySet } from "./streak";

export type XpState = {
  xp: number;
  level: number;
  intoLevel: number; // XP earned within the current level
  nextLevelXp: number; // XP needed to clear the current level
  pctToNext: number; // 0–1 progress toward next level
  title: string;
};

// Playful rank names as the user levels up.
const TITLES = [
  "Sprout",
  "Seedling",
  "Snack Scout",
  "Forager",
  "Macro Apprentice",
  "Macro Master",
  "Nutrition Ninja",
  "Belly Boss",
  "HappyBelly Legend",
];

// XP needed to clear a given level (gently increasing curve).
function costForLevel(level: number): number {
  return 120 + (level - 1) * 60;
}

/**
 * Derive XP + level purely from logged activity:
 *   +15 per meal logged, +40 per distinct day logged, +12 per weigh-in.
 * Days-logged is weighted heavily to reward consistency (à la Duolingo).
 */
export function computeXp(meals: Meal[], weights: WeightLog[]): XpState {
  const loggedDays = loggedDaySet(meals).size;
  const xp = meals.length * 15 + loggedDays * 40 + weights.length * 12;

  let level = 1;
  let remaining = xp;
  while (remaining >= costForLevel(level)) {
    remaining -= costForLevel(level);
    level += 1;
  }

  const nextLevelXp = costForLevel(level);
  const intoLevel = remaining;
  const pctToNext = Math.max(0, Math.min(1, intoLevel / nextLevelXp));
  const title = TITLES[Math.min(TITLES.length - 1, level - 1)];

  return { xp, level, intoLevel, nextLevelXp, pctToNext, title };
}
