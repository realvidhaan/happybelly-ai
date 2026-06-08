"use client";

import { useEffect, useState } from "react";
import type { ActivityLevel, Goal, Profile, Sex } from "@/lib/types";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  computeAutoTargets,
  kgToLb,
  lbToKg,
  round1,
} from "@/lib/nutrition";
import { MACRO_ORDER, MACROS } from "@/lib/macros";
import Modal from "./ui/Modal";

export default function ProfileModal({
  open,
  profile,
  onClose,
  onSave,
}: {
  open: boolean;
  profile: Profile;
  onClose: () => void;
  onSave: (p: Profile) => void;
}) {
  const [draft, setDraft] = useState<Profile>(profile);
  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  const imperial = draft.unit === "imperial";
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const auto = computeAutoTargets(draft);
  const shownTargets = draft.useAutoTargets ? auto : draft.targets;

  const save = () => {
    onSave({ ...draft, targets: draft.useAutoTargets ? auto : draft.targets });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your profile & goals"
      subtitle="Used to compute targets and your baseline TDEE."
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={save} className="btn-primary">
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            className="input"
            placeholder="You"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sex">
            <Segmented
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
              value={draft.sex}
              onChange={(v) => set("sex", v as Sex)}
            />
          </Field>
          <Field label="Units">
            <Segmented
              options={[
                { value: "metric", label: "Metric" },
                { value: "imperial", label: "Imperial" },
              ]}
              value={draft.unit}
              onChange={(v) => set("unit", v as Profile["unit"])}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Age">
            <input
              type="number"
              value={draft.age}
              onChange={(e) => set("age", Math.max(0, Number(e.target.value) || 0))}
              className="input"
            />
          </Field>
          <Field label={imperial ? "Height (in)" : "Height (cm)"}>
            <input
              type="number"
              value={imperial ? round1(draft.heightCm / 2.54) : round1(draft.heightCm)}
              onChange={(e) => {
                const n = Number(e.target.value) || 0;
                set("heightCm", imperial ? round1(n * 2.54) : n);
              }}
              className="input"
            />
          </Field>
          <Field label={imperial ? "Weight (lb)" : "Weight (kg)"}>
            <input
              type="number"
              value={imperial ? kgToLb(draft.weightKg) : round1(draft.weightKg)}
              onChange={(e) => {
                const n = Number(e.target.value) || 0;
                set("weightKg", imperial ? lbToKg(n) : n);
              }}
              className="input"
            />
          </Field>
        </div>

        <Field label="Activity level">
          <select
            value={draft.activity}
            onChange={(e) => set("activity", e.target.value as ActivityLevel)}
            className="input"
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>
                {ACTIVITY_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Goal">
          <Segmented
            options={(Object.keys(GOAL_LABELS) as Goal[]).map((g) => ({
              value: g,
              label: GOAL_LABELS[g],
            }))}
            value={draft.goal}
            onChange={(v) => set("goal", v as Goal)}
          />
        </Field>

        {/* Targets */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <label className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Auto-calculate macro targets
            </span>
            <input
              type="checkbox"
              checked={draft.useAutoTargets}
              onChange={(e) => set("useAutoTargets", e.target.checked)}
              className="h-5 w-5 accent-belly-500"
            />
          </label>
          <p className="mt-1 text-xs text-slate-400">
            {draft.useAutoTargets
              ? "Derived from your stats with the Mifflin–St Jeor equation."
              : "Set your own targets below."}
          </p>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {MACRO_ORDER.map((key) => (
              <div key={key}>
                <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: MACROS[key].color }} />
                  {MACROS[key].short}
                </div>
                <input
                  type="number"
                  disabled={draft.useAutoTargets}
                  value={shownTargets[key]}
                  onChange={(e) =>
                    set("targets", {
                      ...draft.targets,
                      [key]: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="input px-2 py-1.5 text-center text-sm tabular-nums disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            value === o.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
