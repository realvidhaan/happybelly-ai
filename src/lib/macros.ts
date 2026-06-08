import type { MacroSet } from "./types";

export type MacroKey = keyof MacroSet;

export type MacroMeta = {
  key: MacroKey;
  label: string;
  short: string;
  unit: string;
  color: string; // hex — used inline so Tailwind purge never strips it
  soft: string; // translucent version for tracks/fills
};

// Single source of truth for macro presentation. Keep hex values in sync with
// the `cal/protein/carbs/fats` colors in tailwind.config.ts.
export const MACROS: Record<MacroKey, MacroMeta> = {
  calories: {
    key: "calories",
    label: "Calories",
    short: "Cal",
    unit: "kcal",
    color: "#ffc800",
    soft: "rgba(255, 200, 0, 0.15)",
  },
  protein: {
    key: "protein",
    label: "Protein",
    short: "Protein",
    unit: "g",
    color: "#fb7185",
    soft: "rgba(251, 113, 133, 0.15)",
  },
  carbs: {
    key: "carbs",
    label: "Carbs",
    short: "Carbs",
    unit: "g",
    color: "#38bdf8",
    soft: "rgba(56, 189, 248, 0.15)",
  },
  fats: {
    key: "fats",
    label: "Fats",
    short: "Fats",
    unit: "g",
    color: "#a78bfa",
    soft: "rgba(167, 139, 250, 0.15)",
  },
};

export const MACRO_ORDER: MacroKey[] = ["calories", "protein", "carbs", "fats"];
