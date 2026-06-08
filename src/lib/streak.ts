import { addDays, todayStr } from "./date";
import type { Meal } from "./types";

export function loggedDaySet(meals: Meal[]): Set<string> {
  const s = new Set<string>();
  for (const m of meals) {
    if (m.items.length > 0) s.add(m.date);
  }
  return s;
}

/**
 * Consecutive days logged, ending today. Today not being logged *yet* doesn't
 * break the streak (grace for the current day) — we anchor on today if it's
 * logged, otherwise on yesterday, then walk backwards.
 */
export function currentStreak(meals: Meal[]): number {
  const days = loggedDaySet(meals);
  const today = todayStr();
  let cursor = days.has(today) ? today : addDays(today, -1);

  // If neither today nor yesterday is logged, the streak is broken.
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(meals: Meal[]): number {
  const days = [...loggedDaySet(meals)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    if (prev && addDays(prev, 1) === d) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

// Trailing N-day calendar (oldest → newest) with a logged flag, for the dot strip.
export function recentDays(meals: Meal[], n = 7): { date: string; logged: boolean }[] {
  const days = loggedDaySet(meals);
  const today = todayStr();
  const out: { date: string; logged: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    out.push({ date, logged: days.has(date) });
  }
  return out;
}
