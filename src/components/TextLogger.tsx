"use client";

import { useState } from "react";
import { Sparkles, Loader2, CornerDownLeft } from "lucide-react";
import { useTracker } from "@/lib/store";
import type { ParseResponse } from "@/lib/types";

const EXAMPLES = [
  "Three scrambled eggs, two slices of sourdough toast with butter, and a protein shake",
  "Chipotle chicken burrito bowl with brown rice, black beans, guac and cheese",
  "A grande oat milk latte and a blueberry muffin",
  "200g grilled salmon, roasted potatoes, and a big green salad",
];

export default function TextLogger({
  onParsed,
}: {
  onParsed: (res: ParseResponse) => void;
}) {
  const { learnedCorrections } = useTracker();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    const value = text.trim();
    if (!value || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/log-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, corrections: learnedCorrections() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      onParsed(data as ParseResponse);
      setText("");
    } catch (e: any) {
      setError(e?.message || "Failed to analyze. Check your GROQ_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze();
          }}
          rows={3}
          maxLength={2000}
          placeholder="Describe your meal in plain English…"
          className="input min-h-[88px] resize-none pr-3 text-[15px] leading-relaxed"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setText(ex)}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-200"
          >
            {ex.length > 42 ? ex.slice(0, 40) + "…" : ex}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">
          <CornerDownLeft className="h-3 w-3" /> ⌘/Ctrl + Enter to analyze
        </span>
        <button onClick={analyze} disabled={!text.trim() || loading} className="btn-primary ml-auto">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Analyze with AI
            </>
          )}
        </button>
      </div>
    </div>
  );
}
