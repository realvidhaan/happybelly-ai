"use client";

import { Activity, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import type { Meal, Profile, WeightLog } from "@/lib/types";
import { computeAdaptiveTdee } from "@/lib/tdee";

const CONFIDENCE_STYLE: Record<string, string> = {
  none: "bg-slate-100 text-slate-500",
  low: "bg-amber-100 text-amber-700",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-emerald-100 text-emerald-700",
};

export default function TdeeCard({
  meals,
  weights,
  profile,
}: {
  meals: Meal[];
  weights: WeightLog[];
  profile: Profile;
}) {
  const t = computeAdaptiveTdee(meals, weights, profile);
  const trend = t.weightTrendKgPerWeek;
  const TrendIcon = trend < -0.05 ? TrendingDown : trend > 0.05 ? TrendingUp : Minus;
  const trendColor =
    trend < -0.05 ? "text-emerald-600" : trend > 0.05 ? "text-rose-600" : "text-slate-500";

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-belly-500" />
          <h3 className="text-sm font-bold text-slate-800">Adaptive TDEE</h3>
        </div>
        <span
          className={`chip ${CONFIDENCE_STYLE[t.confidence]}`}
          title="Confidence grows as you log more days and weigh-ins."
        >
          {t.confidence === "none" ? "estimate" : `${t.confidence} confidence`}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums text-slate-900">
          {t.tdee.toLocaleString()}
        </span>
        <span className="pb-1 text-sm text-slate-500">kcal/day maintenance</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="7-day intake" value={t.loggedDays ? `${t.avgIntake}` : "—"} sub="kcal/day avg" />
        <Stat
          label="Weight trend"
          value={`${trend > 0 ? "+" : ""}${trend.toFixed(2)}`}
          sub="kg/week"
          icon={<TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />}
        />
        <Stat label="Baseline" value={`${t.staticEstimate}`} sub="Mifflin × activity" />
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t.usedFallback
          ? "Showing your baseline estimate. Log meals on 3+ days and add 2+ weigh-ins to unlock your true, adaptive TDEE."
          : "Computed from your real intake vs. weight trend over a rolling 7-day window — not a generic formula."}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 flex items-center justify-center gap-1 text-base font-bold tabular-nums text-slate-800">
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
