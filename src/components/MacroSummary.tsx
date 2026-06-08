"use client";

import type { MacroSet } from "@/lib/types";
import { MACROS } from "@/lib/macros";
import { calorieSplit } from "@/lib/nutrition";
import ProgressRing from "./ProgressRing";
import MacroBar from "./MacroBar";

export default function MacroSummary({
  consumed,
  targets,
}: {
  consumed: MacroSet;
  targets: MacroSet;
}) {
  const split = calorieSplit(consumed);
  const totalEnergy = split.protein + split.carbs + split.fats || 1;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Hero calories ring */}
        <div className="flex flex-1 items-center justify-center gap-6">
          <ProgressRing
            value={consumed.calories}
            target={targets.calories}
            color="#58cc02"
            size={168}
            stroke={16}
            label="Calories"
            unit="kcal"
            big
          />
          <div className="hidden flex-col gap-2 sm:flex">
            <Legend
              color={MACROS.protein.color}
              label="Protein"
              pct={(split.protein / totalEnergy) * 100}
            />
            <Legend
              color={MACROS.carbs.color}
              label="Carbs"
              pct={(split.carbs / totalEnergy) * 100}
            />
            <Legend
              color={MACROS.fats.color}
              label="Fats"
              pct={(split.fats / totalEnergy) * 100}
            />
            <p className="mt-1 max-w-[12rem] text-xs text-slate-400">
              Share of energy consumed today by macronutrient.
            </p>
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex flex-1 flex-col gap-4">
          <MacroBar
            label="Protein"
            value={consumed.protein}
            target={targets.protein}
            unit="g"
            color={MACROS.protein.color}
          />
          <MacroBar
            label="Carbs"
            value={consumed.carbs}
            target={targets.carbs}
            unit="g"
            color={MACROS.carbs.color}
          />
          <MacroBar
            label="Fats"
            value={consumed.fats}
            target={targets.fats}
            unit="g"
            color={MACROS.fats.color}
          />
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
      <span className="font-medium text-slate-600">{label}</span>
      <span className="tabular-nums text-slate-400">{Math.round(pct)}%</span>
    </div>
  );
}
