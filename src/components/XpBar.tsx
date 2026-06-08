"use client";

import { Star, Zap } from "lucide-react";
import type { Meal, WeightLog } from "@/lib/types";
import { computeXp } from "@/lib/xp";

export default function XpBar({
  meals,
  weights,
}: {
  meals: Meal[];
  weights: WeightLog[];
}) {
  const xp = computeXp(meals, weights);

  return (
    <section className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      {/* Level badge */}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-sun-500 text-belly-700 shadow-pop-sun sm:h-16 sm:w-16">
        <Star className="h-7 w-7 fill-belly-700 sm:h-8 sm:w-8" />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-belly-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
          LV {xp.level}
        </span>
      </div>

      {/* Title + progress */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-base font-extrabold text-slate-800 sm:text-lg">
            {xp.title}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-black text-sun-600">
            <Zap className="h-3.5 w-3.5 fill-sun-500" />
            {xp.xp.toLocaleString()} XP
          </span>
        </div>

        <div className="relative h-4 w-full overflow-hidden rounded-full border-2 border-sun-200 bg-sun-50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sun-400 to-sun-500 transition-[width] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ width: `${Math.max(6, xp.pctToNext * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] font-bold text-slate-400">
          {xp.intoLevel} / {xp.nextLevelXp} XP to Level {xp.level + 1}
        </div>
      </div>
    </section>
  );
}
