"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Correction,
  FoodItem,
  Meal,
  MealSource,
  ParsedItem,
  Profile,
  WeightLog,
} from "./types";
import { todayStr } from "./date";
import { diffCorrections, topCorrections } from "./corrections";
import { scaleItem } from "./nutrition";

const STORAGE_KEY = "happybelly:v1";

type PersistShape = {
  profile: Profile;
  meals: Meal[];
  weights: WeightLog[];
  corrections: Correction[];
};

export const DEFAULT_PROFILE: Profile = {
  name: "You",
  sex: "male",
  age: 30,
  heightCm: 178,
  weightKg: 80,
  activity: "moderate",
  goal: "maintain",
  unit: "metric",
  useAutoTargets: true,
  targets: { calories: 2200, protein: 165, carbs: 220, fats: 73 },
};

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.floor(performance.now() * 1000)}-${Math.floor(performance.timeOrigin)}`;
}

function load(): PersistShape {
  if (typeof window === "undefined") {
    return { profile: DEFAULT_PROFILE, meals: [], weights: [], corrections: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { profile: DEFAULT_PROFILE, meals: [], weights: [], corrections: [] };
    }
    const parsed = JSON.parse(raw) as Partial<PersistShape>;
    return {
      profile: { ...DEFAULT_PROFILE, ...(parsed.profile ?? {}) },
      meals: parsed.meals ?? [],
      weights: parsed.weights ?? [],
      corrections: parsed.corrections ?? [],
    };
  } catch {
    return { profile: DEFAULT_PROFILE, meals: [], weights: [], corrections: [] };
  }
}

type TrackerContextValue = {
  hydrated: boolean;
  profile: Profile;
  meals: Meal[];
  weights: WeightLog[];
  corrections: Correction[];

  setProfile: (p: Profile) => void;
  // Commit a reviewed meal. `original` (the raw AI items) lets us learn corrections.
  addMeal: (input: {
    date: string;
    title: string;
    source: MealSource;
    note?: string;
    items: FoodItem[];
    original?: ParsedItem[];
  }) => void;
  updateMeal: (id: string, patch: Partial<Pick<Meal, "title" | "items" | "note">>) => void;
  deleteMeal: (id: string) => void;
  scaleMeal: (id: string, factor: number) => void;

  setWeight: (date: string, weightKg: number) => void;
  deleteWeight: (id: string) => void;

  // Top corrections to ship to the AI as few-shot examples.
  learnedCorrections: () => Correction[];
  resetAll: () => void;
  loadSampleData: () => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistShape>(() => ({
    profile: DEFAULT_PROFILE,
    meals: [],
    weights: [],
    corrections: [],
  }));
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [state, hydrated]);

  const setProfile = useCallback((profile: Profile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const addMeal: TrackerContextValue["addMeal"] = useCallback((input) => {
    setState((s) => {
      const meal: Meal = {
        id: uid(),
        date: input.date,
        createdAt: new Date().toISOString(),
        title: input.title,
        source: input.source,
        note: input.note,
        items: input.items.map((it) => ({ ...it, id: it.id || uid() })),
      };
      const newCorrections = input.original
        ? diffCorrections(input.original, input.items).map((c) => ({
            ...c,
            id: uid(),
            createdAt: meal.createdAt,
          }))
        : [];
      return {
        ...s,
        meals: [meal, ...s.meals],
        corrections: [...newCorrections, ...s.corrections].slice(0, 500),
      };
    });
  }, []);

  const updateMeal: TrackerContextValue["updateMeal"] = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const deleteMeal = useCallback((id: string) => {
    setState((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }));
  }, []);

  const scaleMeal = useCallback((id: string, factor: number) => {
    setState((s) => ({
      ...s,
      meals: s.meals.map((m) =>
        m.id === id ? { ...m, items: m.items.map((it) => scaleItem(it, factor)) } : m
      ),
    }));
  }, []);

  const setWeight = useCallback((date: string, weightKg: number) => {
    setState((s) => {
      const existing = s.weights.find((w) => w.date === date);
      const weights = existing
        ? s.weights.map((w) => (w.date === date ? { ...w, weightKg } : w))
        : [...s.weights, { id: uid(), date, weightKg }];
      weights.sort((a, b) => a.date.localeCompare(b.date));
      return { ...s, weights };
    });
  }, []);

  const deleteWeight = useCallback((id: string) => {
    setState((s) => ({ ...s, weights: s.weights.filter((w) => w.id !== id) }));
  }, []);

  const learnedCorrections = useCallback(
    () => topCorrections(state.corrections, 5),
    [state.corrections]
  );

  const resetAll = useCallback(() => {
    setState({ profile: DEFAULT_PROFILE, meals: [], weights: [], corrections: [] });
  }, []);

  const loadSampleData = useCallback(() => {
    setState((s) => ({ ...s, ...buildSampleData() }));
  }, []);

  const value = useMemo<TrackerContextValue>(
    () => ({
      hydrated,
      ...state,
      setProfile,
      addMeal,
      updateMeal,
      deleteMeal,
      scaleMeal,
      setWeight,
      deleteWeight,
      learnedCorrections,
      resetAll,
      loadSampleData,
    }),
    [
      hydrated,
      state,
      setProfile,
      addMeal,
      updateMeal,
      deleteMeal,
      scaleMeal,
      setWeight,
      deleteWeight,
      learnedCorrections,
      resetAll,
      loadSampleData,
    ]
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): TrackerContextValue {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used within <TrackerProvider>.");
  return ctx;
}

// ── Sample data so a fresh install looks alive on first load ─────────────────
function buildSampleData(): Partial<PersistShape> {
  const d = (n: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - n);
    return dt.toISOString().slice(0, 10);
  };
  const item = (
    name: string,
    grams: number,
    calories: number,
    protein: number,
    carbs: number,
    fats: number
  ): FoodItem => ({ id: uid(), name, grams, calories, protein, carbs, fats, confidence: 0.8 });

  const meals: Meal[] = [
    {
      id: uid(),
      date: todayStr(),
      createdAt: new Date().toISOString(),
      title: "Breakfast",
      source: "text",
      items: [
        item("Scrambled eggs (3)", 150, 215, 18, 2, 15),
        item("Sourdough toast (2 slices)", 96, 240, 8, 46, 2),
        item("Butter", 14, 100, 0, 0, 11),
        item("Whey protein shake", 350, 160, 30, 5, 2),
      ],
    },
    {
      id: uid(),
      date: d(1),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      title: "Chicken & rice bowl",
      source: "vision",
      items: [
        item("Grilled chicken breast", 170, 280, 52, 0, 7),
        item("Jasmine rice", 200, 260, 5, 56, 1),
        item("Broccoli", 120, 42, 3, 8, 0),
      ],
    },
  ];

  const weights: WeightLog[] = [6, 5, 4, 3, 2, 1, 0].map((n, i) => ({
    id: uid(),
    date: d(n),
    weightKg: 80.4 - i * 0.12,
  }));

  return { meals, weights };
}
