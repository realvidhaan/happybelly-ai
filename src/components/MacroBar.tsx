"use client";

export default function MacroBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const ratio = target > 0 ? value / target : 0;
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  const perfect = ratio >= 0.97 && ratio <= 1.06;
  const over = ratio > 1.06;
  const remaining = Math.round(target - value);
  // Over-target keeps the macro's own color; "over" is signalled by text only.
  const fill = perfect ? "#ffc800" : color;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: color }} />
          <span className="text-sm font-extrabold text-slate-700">{label}</span>
        </div>
        <div className="text-xs font-bold tabular-nums text-slate-500">
          <span className="font-black text-slate-800">{Math.round(value)}</span>
          {" / "}
          {Math.round(target)} {unit}
        </div>
      </div>
      <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
      <div
        className={`mt-1 text-right text-[11px] font-bold ${
          perfect ? "text-belly-700" : over ? "text-amber-700" : "text-slate-500"
        }`}
      >
        {perfect
          ? "🎯 Perfect!"
          : over
            ? `${Math.abs(remaining)} ${unit} over`
            : `${Math.max(0, remaining)} ${unit} to go`}
      </div>
    </div>
  );
}
