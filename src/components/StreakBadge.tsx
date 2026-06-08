"use client";

import { Flame } from "lucide-react";
import type { Meal } from "@/lib/types";
import { currentStreak, longestStreak, recentDays } from "@/lib/streak";
import { formatDayLabel, weekdayInitial } from "@/lib/date";

export default function StreakBadge({ meals }: { meals: Meal[] }) {
  const streak = currentStreak(meals);
  const best = longestStreak(meals);
  const days = recentDays(meals, 7);
  const hot = streak >= 3;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              hot ? "bg-sun-100 text-sun-600 shadow-pop-sun" : "bg-slate-100 text-slate-400"
            }`}
          >
            <Flame className={`h-6 w-6 ${hot ? "animate-wiggle fill-sun-400" : ""}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tabular-nums text-slate-900">{streak}</span>
              <span className="text-sm font-bold text-slate-500">
                day{streak === 1 ? "" : "s"} streak
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Best: {best} day{best === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-1.5">
        {days.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              title={formatDayLabel(d.date)}
              className={`h-9 w-full rounded-lg transition ${
                d.logged ? "bg-belly-400" : "bg-slate-100"
              }`}
            />
            <span className="text-[10px] font-medium text-slate-400">
              {weekdayInitial(d.date)}
            </span>
          </div>
        ))}
      </div>
      {streak === 0 && (
        <p className="mt-3 text-center text-xs text-slate-400">
          Log a meal today to start a streak 🔥
        </p>
      )}
    </section>
  );
}
