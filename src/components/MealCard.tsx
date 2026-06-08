"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  PencilLine,
  Trash2,
  Camera,
  Type,
  Hand,
} from "lucide-react";
import type { Meal } from "@/lib/types";
import { MACROS } from "@/lib/macros";
import { sumItems, round1 } from "@/lib/nutrition";
import { formatTime } from "@/lib/date";
import { useTracker } from "@/lib/store";

const SOURCE_META = {
  text: { icon: Type, label: "Plain English" },
  vision: { icon: Camera, label: "Photo" },
  manual: { icon: Hand, label: "Manual" },
} as const;

export default function MealCard({
  meal,
  onEdit,
}: {
  meal: Meal;
  onEdit: (meal: Meal) => void;
}) {
  const { scaleMeal, deleteMeal } = useTracker();
  const [open, setOpen] = useState(false);
  const totals = sumItems(meal.items);
  const Src = SOURCE_META[meal.source] ?? SOURCE_META.manual;
  const SrcIcon = Src.icon;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-belly-50 text-belly-500">
            <SrcIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-semibold text-slate-800">{meal.title}</h4>
              <span className="shrink-0 text-xs text-slate-400">{formatTime(meal.createdAt)}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold tabular-nums text-slate-700">
                {Math.round(totals.calories)} kcal
              </span>
              <Dot c={MACROS.protein.color} v={totals.protein} s="P" />
              <Dot c={MACROS.carbs.color} v={totals.carbs} s="C" />
              <Dot c={MACROS.fats.color} v={totals.fats} s="F" />
            </div>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-300" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-300" />
          )}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-slate-100 px-4 py-3">
          <ul className="space-y-1.5">
            {meal.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-slate-600">
                  {it.name}
                  <span className="ml-1 text-xs text-slate-400">{round1(it.grams)}g</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-slate-500">
                  {Math.round(it.calories)} kcal · {round1(it.protein)}/{round1(it.carbs)}/
                  {round1(it.fats)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
              Quick adjust
            </span>
            <button onClick={() => scaleMeal(meal.id, 0.5)} className="btn-soft px-2.5 py-1 text-xs">
              ½× Halve
            </button>
            <button onClick={() => scaleMeal(meal.id, 2)} className="btn-soft px-2.5 py-1 text-xs">
              2× Double
            </button>
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => onEdit(meal)}
                className="btn-soft px-2.5 py-1 text-xs"
                aria-label="Edit meal"
              >
                <PencilLine className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => deleteMeal(meal.id)}
                className="btn px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"
                aria-label="Delete meal"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dot({ c, v, s }: { c: string; v: number; s: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      <span className="tabular-nums">
        {round1(v)}
        {s}
      </span>
    </span>
  );
}
