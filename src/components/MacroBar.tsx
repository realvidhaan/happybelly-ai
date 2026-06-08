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
  const over = ratio > 1.02;
  const remaining = Math.round(target - value);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        <div className="text-xs tabular-nums text-slate-500">
          <span className="font-semibold text-slate-800">{Math.round(value)}</span>
          {" / "}
          {Math.round(target)} {unit}
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: over ? "#ef4444" : color }}
        />
      </div>
      <div className={`mt-1 text-right text-[11px] ${over ? "text-red-500" : "text-slate-400"}`}>
        {over ? `${Math.abs(remaining)} ${unit} over` : `${Math.max(0, remaining)} ${unit} left`}
      </div>
    </div>
  );
}
