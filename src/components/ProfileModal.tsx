"use client";

import { useEffect, useState } from "react";
import type { ActivityLevel, Goal, MacroSet, Profile, Sex } from "@/lib/types";
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

// Parse a free-text numeric string without forcing formatting on the user.
function num(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function displayWeight(p: Profile): string {
  const v = p.unit === "imperial" ? kgToLb(p.weightKg) : round1(p.weightKg);
  return v ? String(v) : "";
}
function displayHeight(p: Profile): string {
  const v = p.unit === "imperial" ? round1(p.heightCm / 2.54) : round1(p.heightCm);
  return v ? String(v) : "";
}

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
  // Non-numeric fields
  const [name, setName] = useState(profile.name);
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [unit, setUnit] = useState<Profile["unit"]>(profile.unit);
  const [activity, setActivity] = useState<ActivityLevel>(profile.activity);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [useAutoTargets, setUseAutoTargets] = useState(profile.useAutoTargets);
  const [targets, setTargets] = useState<MacroSet>(profile.targets);

  // Numeric fields are kept as RAW STRINGS so the user can type/delete freely.
  // Nothing is converted or rounded on each keystroke — only on Save.
  const [ageStr, setAgeStr] = useState(String(profile.age));
  const [heightStr, setHeightStr] = useState(displayHeight(profile));
  const [weightStr, setWeightStr] = useState(displayWeight(profile));

  // Reset the form whenever the modal is (re)opened.
  useEffect(() => {
    if (!open) return;
    setName(profile.name);
    setSex(profile.sex);
    setUnit(profile.unit);
    setActivity(profile.activity);
    setGoal(profile.goal);
    setUseAutoTargets(profile.useAutoTargets);
    setTargets(profile.targets);
    setAgeStr(String(profile.age));
    setHeightStr(displayHeight(profile));
    setWeightStr(displayWeight(profile));
  }, [open, profile]);

  // Switching units converts the currently-typed values once (not on every key).
  const changeUnit = (next: Profile["unit"]) => {
    if (next === unit) return;
    const w = num(weightStr);
    if (w) {
      const kg = unit === "imperial" ? lbToKg(w) : w;
      setWeightStr(String(next === "imperial" ? kgToLb(kg) : round1(kg)));
    }
    const h = num(heightStr);
    if (h) {
      const cm = unit === "imperial" ? h * 2.54 : h;
      setHeightStr(String(next === "imperial" ? round1(cm / 2.54) : round1(cm)));
    }
    setUnit(next);
  };

  const imperial = unit === "imperial";

  // Live profile snapshot (canonical units) for the auto-target preview + save.
  const previewProfile: Profile = {
    name,
    sex,
    age: Math.round(num(ageStr)),
    heightCm: imperial ? round1(num(heightStr) * 2.54) : num(heightStr),
    weightKg: imperial ? lbToKg(num(weightStr)) : num(weightStr),
    activity,
    goal,
    unit,
    useAutoTargets,
    targets,
  };
  const auto = computeAutoTargets(previewProfile);
  const shownTargets = useAutoTargets ? auto : targets;

  const save = () => {
    onSave({ ...previewProfile, targets: useAutoTargets ? auto : targets });
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              value={sex}
              onChange={(v) => setSex(v as Sex)}
            />
          </Field>
          <Field label="Units">
            <Segmented
              options={[
                { value: "metric", label: "Metric" },
                { value: "imperial", label: "Imperial" },
              ]}
              value={unit}
              onChange={(v) => changeUnit(v as Profile["unit"])}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Age">
            <input
              type="text"
              inputMode="numeric"
              value={ageStr}
              onChange={(e) => setAgeStr(e.target.value)}
              className="input"
              placeholder="30"
            />
          </Field>
          <Field label={imperial ? "Height (in)" : "Height (cm)"}>
            <input
              type="text"
              inputMode="decimal"
              value={heightStr}
              onChange={(e) => setHeightStr(e.target.value)}
              className="input"
              placeholder={imperial ? "70" : "178"}
            />
          </Field>
          <Field label={imperial ? "Weight (lb)" : "Weight (kg)"}>
            <input
              type="text"
              inputMode="decimal"
              value={weightStr}
              onChange={(e) => setWeightStr(e.target.value)}
              className="input"
              placeholder={imperial ? "165" : "75"}
            />
          </Field>
        </div>

        <Field label="Activity level">
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
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
            value={goal}
            onChange={(v) => setGoal(v as Goal)}
          />
        </Field>

        {/* Targets */}
        <div className="rounded-3xl border-2 border-belly-100 bg-belly-50/60 p-3.5">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-extrabold text-slate-700">
              Auto-calculate macro targets
            </span>
            <input
              type="checkbox"
              checked={useAutoTargets}
              onChange={(e) => {
                const on = e.target.checked;
                setUseAutoTargets(on);
                if (!on) setTargets(auto); // seed manual editing from current auto
              }}
              className="h-5 w-5 accent-belly-500"
            />
          </label>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {useAutoTargets
              ? "Derived from your stats with the Mifflin–St Jeor equation."
              : "Set your own targets below."}
          </p>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {MACRO_ORDER.map((key) => (
              <div key={key}>
                <div className="mb-1 flex items-center gap-1 text-[11px] font-extrabold text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: MACROS[key].color }} />
                  {MACROS[key].short}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={useAutoTargets}
                  value={String(shownTargets[key])}
                  onChange={(e) =>
                    setTargets({ ...targets, [key]: Math.max(0, Math.round(num(e.target.value))) })
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
    <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl px-2 py-2 text-xs font-extrabold transition-all duration-150 ${
            value === o.value
              ? "bg-white text-belly-600 shadow-[0_2px_0_0_rgba(15,23,42,0.08)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
