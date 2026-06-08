"use client";

type Props = {
  value: number;
  target: number;
  color: string;
  size?: number;
  stroke?: number;
  label: string;
  unit: string;
  big?: boolean;
};

export default function ProgressRing({
  value,
  target,
  color,
  size = 120,
  stroke = 11,
  label,
  unit,
  big = false,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = target > 0 ? value / target : 0;
  const pct = Math.max(0, Math.min(1, ratio));
  const over = ratio > 1.02;
  const remaining = Math.round(target - value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#eef2f7"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={over ? "#ef4444" : color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold tabular-nums leading-none ${big ? "text-3xl" : "text-xl"}`}
            style={{ color: over ? "#ef4444" : "#0f172a" }}
          >
            {Math.round(value)}
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-slate-400">
            / {Math.round(target)} {unit}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className={`text-xs ${over ? "text-red-500" : "text-slate-400"}`}>
          {over ? `${Math.abs(remaining)} ${unit} over` : `${Math.max(0, remaining)} ${unit} left`}
        </div>
      </div>
    </div>
  );
}
