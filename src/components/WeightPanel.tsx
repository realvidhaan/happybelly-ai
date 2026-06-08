"use client";

import { useMemo, useState } from "react";
import { Scale, Plus } from "lucide-react";
import { useTracker } from "@/lib/store";
import { todayStr, formatDayLabel } from "@/lib/date";
import { kgToLb, lbToKg, round1 } from "@/lib/nutrition";

export default function WeightPanel() {
  const { weights, profile, setWeight } = useTracker();
  const imperial = profile.unit === "imperial";
  const unit = imperial ? "lb" : "kg";

  const todays = weights.find((w) => w.date === todayStr());
  const [draft, setDraft] = useState<string>(
    todays ? String(imperial ? kgToLb(todays.weightKg) : round1(todays.weightKg)) : ""
  );

  const recent = useMemo(
    () => [...weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [weights]
  );

  const sparkline = useMemo(() => buildSparkline(weights, imperial), [weights, imperial]);

  const save = () => {
    const n = parseFloat(draft);
    if (!Number.isFinite(n) || n <= 0) return;
    setWeight(todayStr(), imperial ? lbToKg(n) : n);
  };

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Scale className="h-4 w-4 text-belly-500" />
        <h3 className="text-sm font-bold text-slate-800">Weight</h3>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="label">Today&apos;s weigh-in</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder={`0.0 ${unit}`}
              className="input"
            />
            <button onClick={save} className="btn-primary shrink-0" aria-label="Save weight">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {sparkline && (
        <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="mt-4 h-12 w-full">
          <polyline
            points={sparkline.points}
            fill="none"
            stroke="#58cc02"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {recent.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {recent.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between text-sm text-slate-600"
            >
              <span className="text-slate-500">{formatDayLabel(w.date)}</span>
              <span className="font-semibold tabular-nums">
                {imperial ? kgToLb(w.weightKg) : round1(w.weightKg)} {unit}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Add weigh-ins to power your adaptive TDEE.
        </p>
      )}
    </section>
  );
}

function buildSparkline(
  weights: { date: string; weightKg: number }[],
  imperial: boolean
): { points: string } | null {
  if (weights.length < 2) return null;
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const vals = sorted.map((w) => (imperial ? w.weightKg / 0.45359237 : w.weightKg));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const points = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * 100;
      const y = 34 - ((v - min) / span) * 32;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return { points };
}
