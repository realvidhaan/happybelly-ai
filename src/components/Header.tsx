"use client";

import { Salad, Settings, BrainCircuit } from "lucide-react";

export default function Header({
  name,
  learnedCount,
  onOpenProfile,
}: {
  name: string;
  learnedCount: number;
  onOpenProfile: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-belly-400 to-belly-600 text-white shadow-soft">
          <Salad className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            HappyBelly <span className="text-belly-500">AI</span>
          </h1>
          <p className="text-xs text-slate-400">Log a meal in seconds — just say it or shoot it.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {learnedCount > 0 && (
          <span
            className="hidden items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600 sm:inline-flex"
            title={`HappyBelly AI has learned ${learnedCount} of your personal corrections and applies them to new estimates.`}
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            Learning · {learnedCount}
          </span>
        )}
        <button
          onClick={onOpenProfile}
          className="btn-soft"
          aria-label="Profile and goals"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">{name}</span>
        </button>
      </div>
    </header>
  );
}
