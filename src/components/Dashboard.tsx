"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useTracker } from "@/lib/store";
import { addDays, formatDayLabel, todayStr } from "@/lib/date";
import { resolveTargets, sumMeals } from "@/lib/nutrition";
import { burstConfetti, celebrateConfetti } from "@/lib/confetti";
import type { Meal, ParseResponse } from "@/lib/types";
import Header from "./Header";
import XpBar from "./XpBar";
import MacroSummary from "./MacroSummary";
import QuickLogPanel from "./QuickLogPanel";
import MealTimeline from "./MealTimeline";
import StreakBadge from "./StreakBadge";
import TdeeCard from "./TdeeCard";
import WeightPanel from "./WeightPanel";
import ProfileModal from "./ProfileModal";
import ReviewModal, { type ReviewDraft } from "./ReviewModal";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;
}

export default function Dashboard() {
  const {
    hydrated,
    profile,
    meals,
    weights,
    setProfile,
    addMeal,
    updateMeal,
    learnedCorrections,
    resetAll,
    loadSampleData,
  } = useTracker();

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const dayMeals = useMemo(
    () => meals.filter((m) => m.date === selectedDate),
    [meals, selectedDate]
  );
  const consumed = useMemo(() => sumMeals(dayMeals), [dayMeals]);
  const targets = useMemo(() => resolveTargets(profile), [profile]);
  const isToday = selectedDate === todayStr();

  // Celebrate when the user's calories enter the "perfect" band for a day — but
  // only on the transition into the band (never on initial load), once per day.
  const bandByDate = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!hydrated) return;
    const ratio = targets.calories ? consumed.calories / targets.calories : 0;
    const inBand = ratio >= 0.97 && ratio <= 1.06;
    const prev = bandByDate.current[selectedDate];
    if (inBand && prev === false) celebrateConfetti();
    bandByDate.current[selectedDate] = inBand;
  }, [consumed.calories, targets.calories, selectedDate, hydrated]);

  // AI parse → open the review modal pre-filled.
  const onParsed = (res: ParseResponse, source: "text" | "vision") => {
    setDraft({
      title: res.mealTitle || (source === "vision" ? "Photo meal" : "Logged meal"),
      source,
      date: selectedDate,
      original: res.items,
      items: res.items.map((it) => ({ ...it, id: uid() })),
    });
  };

  const onEditMeal = (meal: Meal) => {
    setDraft({
      title: meal.title,
      source: meal.source,
      date: meal.date,
      mealId: meal.id,
      items: meal.items.map((it) => ({ ...it })),
    });
  };

  const onConfirm = (result: ReviewDraft) => {
    if (result.mealId) {
      updateMeal(result.mealId, { title: result.title, items: result.items });
    } else {
      addMeal({
        date: result.date,
        title: result.title,
        source: result.source,
        note: result.note,
        items: result.items,
        original: result.original,
      });
      // Reward committing a fresh meal to the log.
      burstConfetti();
    }
    setDraft(null);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Sparkles className="mr-2 h-5 w-5 animate-pulse text-belly-400" />
        Loading HappyBelly AI…
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Header
        name={profile.name}
        learnedCount={learnedCorrections().length}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Gamified XP / level tracker */}
      <div className="mt-5">
        <XpBar meals={meals} weights={weights} />
      </div>

      {/* Date navigation */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[7rem] text-center text-sm font-bold text-slate-700">
            {formatDayLabel(selectedDate)}
          </span>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            disabled={isToday}
            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="ml-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
            >
              Jump to today
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <MacroSummary consumed={consumed} targets={targets} />
          <QuickLogPanel onParsed={onParsed} />
          <MealTimeline meals={dayMeals} onEdit={onEditMeal} />
        </div>

        <aside className="space-y-5">
          <StreakBadge meals={meals} />
          <TdeeCard meals={meals} weights={weights} profile={profile} />
          <WeightPanel />
        </aside>
      </div>

      {/* Footer utilities */}
      <footer className="mt-10 flex flex-col items-center gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          {meals.length === 0 && weights.length === 0 && (
            <button onClick={loadSampleData} className="btn-soft text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Load sample data
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Reset all data? This clears meals, weights and learned corrections.")) {
                resetAll();
                setSelectedDate(todayStr());
              }
            }}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-red-500"
          >
            <RotateccwIcon /> Reset all data
          </button>
        </div>
        <p className="text-center">
          HappyBelly AI · estimates are approximate — your edits make them sharper over time.
          Data stays in your browser.
        </p>
      </footer>

      <ReviewModal draft={draft} onClose={() => setDraft(null)} onConfirm={onConfirm} />
      <ProfileModal
        open={profileOpen}
        profile={profile}
        onClose={() => setProfileOpen(false)}
        onSave={setProfile}
      />
    </main>
  );
}

// Inline "reset" glyph to keep the lucide import list tidy.
function RotateccwIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
