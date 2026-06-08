"use client";

import { UtensilsCrossed } from "lucide-react";
import type { Meal } from "@/lib/types";
import MealCard from "./MealCard";

export default function MealTimeline({
  meals,
  onEdit,
}: {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
}) {
  const sorted = [...meals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Today&apos;s timeline
        </h3>
        <span className="text-xs text-slate-500">
          {meals.length} meal{meals.length === 1 ? "" : "s"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Nothing logged yet</p>
          <p className="max-w-xs text-xs text-slate-500">
            Describe a meal or snap a photo above — HappyBelly AI will do the math.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((meal) => (
            <MealCard key={meal.id} meal={meal} onEdit={onEdit} />
          ))}
        </div>
      )}
    </section>
  );
}
