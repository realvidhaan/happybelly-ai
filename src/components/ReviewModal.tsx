"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import type { FoodItem, MacroSet, MealSource, ParsedItem } from "@/lib/types";
import { MACROS } from "@/lib/macros";
import { sumItems, scaleItem, round1 } from "@/lib/nutrition";
import { formatDayLabel } from "@/lib/date";
import Modal from "./ui/Modal";

export type ReviewDraft = {
  title: string;
  source: MealSource;
  date: string;
  note?: string;
  items: FoodItem[];
  // Raw AI estimate, kept so we can learn from the user's edits (review mode only).
  original?: ParsedItem[];
  // When set, we're editing an existing meal rather than reviewing a new one.
  mealId?: string;
};

function newRow(): FoodItem {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r${Math.random()}`,
    name: "",
    grams: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  };
}

const NUM_FIELDS: (keyof MacroSet | "grams")[] = [
  "grams",
  "calories",
  "protein",
  "carbs",
  "fats",
];

export default function ReviewModal({
  draft,
  onClose,
  onConfirm,
}: {
  draft: ReviewDraft | null;
  onClose: () => void;
  onConfirm: (result: ReviewDraft) => void;
}) {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    if (draft) {
      setTitle(draft.title);
      setItems(draft.items.map((it) => ({ ...it })));
    }
  }, [draft]);

  const totals: MacroSet = useMemo(() => sumItems(items), [items]);
  const isEdit = Boolean(draft?.mealId);

  const patch = (id: string, field: keyof FoodItem, value: string | number) => {
    setItems((rows) =>
      rows.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: field === "name" ? value : Math.max(0, Number(value) || 0),
            }
          : r
      )
    );
  };

  const scaleRow = (id: string, factor: number) =>
    setItems((rows) => rows.map((r) => (r.id === id ? scaleItem(r, factor) : r)));

  const removeRow = (id: string) => setItems((rows) => rows.filter((r) => r.id !== id));

  const commit = () => {
    if (!draft) return;
    const cleaned = items
      .map((it) => ({ ...it, name: it.name.trim() }))
      .filter((it) => it.name && (it.calories > 0 || it.grams > 0));
    if (cleaned.length === 0) return;
    onConfirm({ ...draft, title: title.trim() || "Logged meal", items: cleaned });
  };

  if (!draft) return null;

  return (
    <Modal
      open={Boolean(draft)}
      onClose={onClose}
      title={isEdit ? "Edit meal" : "Incoming log review"}
      subtitle={
        isEdit
          ? `Adjust portions, then save.`
          : `HappyBelly AI parsed this — tweak anything before it's logged. Your edits teach it your portions.`
      }
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-bold tabular-nums text-slate-900">
              {Math.round(totals.calories)}
            </span>
            <span className="text-slate-500"> kcal · </span>
            <MacroPill label="P" value={totals.protein} color={MACROS.protein.color} />
            <MacroPill label="C" value={totals.carbs} color={MACROS.carbs.color} />
            <MacroPill label="F" value={totals.fats} color={MACROS.fats.color} />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button onClick={commit} className="btn-primary">
              {isEdit ? "Save changes" : "Add to log"}
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1">
          <label className="label">Meal title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="e.g. Breakfast"
          />
        </div>
        <div className="shrink-0 text-right">
          <span className="label">Day</span>
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
            {formatDayLabel(draft.date)}
          </div>
        </div>
      </div>

      {!isEdit && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-belly-400" />
          {draft.source === "vision" ? "Estimated from your photo" : "Estimated from your description"}
        </div>
      )}

      {/* Column header (desktop) */}
      <div className="hidden grid-cols-[1fr_repeat(5,3.6rem)_2rem] items-center gap-1.5 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        <span>Item</span>
        <span className="text-center">g</span>
        <span className="text-center">kcal</span>
        <span className="text-center">P</span>
        <span className="text-center">C</span>
        <span className="text-center">F</span>
        <span />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 sm:border-0 sm:bg-transparent sm:p-0"
          >
            <div className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[1fr_repeat(5,3.6rem)_2rem]">
              <input
                value={item.name}
                onChange={(e) => patch(item.id, "name", e.target.value)}
                placeholder="Food name"
                className="input py-1.5 text-sm"
              />
              {NUM_FIELDS.map((f) => (
                <input
                  key={f}
                  type="number"
                  inputMode="decimal"
                  value={item[f as keyof FoodItem] as number}
                  onChange={(e) => patch(item.id, f as keyof FoodItem, e.target.value)}
                  className="input px-1.5 py-1.5 text-center text-sm tabular-nums"
                />
              ))}
              <button
                onClick={() => removeRow(item.id)}
                className="flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 sm:mt-1">
              <span className="text-[10px] font-medium uppercase text-slate-300">Quick</span>
              <button onClick={() => scaleRow(item.id, 0.5)} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200">
                ½×
              </button>
              <button onClick={() => scaleRow(item.id, 2)} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200">
                2×
              </button>
              {item.confidence !== undefined && (
                <span className="ml-auto text-[10px] text-slate-300">
                  {Math.round(item.confidence * 100)}% sure
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setItems((rows) => [...rows, newRow()])}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-sm font-medium text-slate-500 transition hover:border-belly-300 hover:text-belly-600"
      >
        <Plus className="h-4 w-4" /> Add item
      </button>
    </Modal>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="mr-1.5 inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="tabular-nums text-slate-600">
        {round1(value)}
        <span className="text-slate-400">{label}</span>
      </span>
    </span>
  );
}
