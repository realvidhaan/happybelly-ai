import type { Correction, CorrectionField, FoodItem, ParsedItem } from "./types";

const FIELDS: CorrectionField[] = ["grams", "calories", "protein", "carbs", "fats"];

// A change is only worth recording if it meaningfully moved the number.
function isMeaningful(field: CorrectionField, ai: number, user: number): boolean {
  if (ai === user) return false;
  const abs = Math.abs(user - ai);
  const rel = ai > 0 ? abs / ai : 1;
  if (field === "calories") return abs >= 15 && rel >= 0.08;
  if (field === "grams") return abs >= 5 && rel >= 0.08;
  return abs >= 2 && rel >= 0.1; // macro grams
}

/**
 * Diff the AI's original estimate against what the user committed. Items are
 * matched by (normalized) name so we attribute the correction to the food.
 */
export function diffCorrections(
  original: ParsedItem[],
  edited: FoodItem[]
): Omit<Correction, "id" | "createdAt">[] {
  const out: Omit<Correction, "id" | "createdAt">[] = [];
  const norm = (s: string) => s.trim().toLowerCase();

  for (const item of edited) {
    const match =
      original.find((o) => norm(o.name) === norm(item.name)) ??
      original.find((o) => norm(item.name).includes(norm(o.name)) || norm(o.name).includes(norm(item.name)));
    if (!match) continue;
    for (const field of FIELDS) {
      const ai = Number(match[field] ?? 0);
      const user = Number((item as unknown as Record<string, number>)[field] ?? 0);
      if (isMeaningful(field, ai, user)) {
        out.push({ foodName: item.name.trim(), field, aiValue: ai, userValue: user });
      }
    }
  }
  return out;
}

/**
 * Pick the most useful corrections to replay as few-shot examples. We collapse
 * by (food, field), keep the most recent value the user prefers, and rank by how
 * often the user has corrected that pairing.
 */
export function topCorrections(corrections: Correction[], limit = 5): Correction[] {
  type Bucket = { count: number; latest: Correction };
  const buckets = new Map<string, Bucket>();

  for (const c of corrections) {
    const key = `${c.foodName.toLowerCase()}::${c.field}`;
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, { count: 1, latest: c });
    } else {
      existing.count += 1;
      if (c.createdAt > existing.latest.createdAt) existing.latest = c;
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count || b.latest.createdAt.localeCompare(a.latest.createdAt))
    .slice(0, limit)
    .map((b) => b.latest);
}

const UNIT: Record<CorrectionField, string> = {
  grams: "g",
  calories: "kcal",
  protein: "g protein",
  carbs: "g carbs",
  fats: "g fat",
};

// Render corrections into compact instruction lines for the system prompt.
export function correctionsToPromptLines(corrections: Correction[]): string {
  return topCorrections(corrections)
    .map(
      (c) =>
        `- For "${c.foodName}", the user prefers ~${c.userValue}${UNIT[c.field]} ` +
        `(you previously estimated ${c.aiValue}${UNIT[c.field]}). Bias toward the user's value for this food.`
    )
    .join("\n");
}
