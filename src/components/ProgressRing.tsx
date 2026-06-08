"use client";

type Props = {
  value: number;
  target: number;
  color: string; // base "in progress" color
  size?: number;
  stroke?: number;
  label: string;
  unit: string;
  big?: boolean;
  celebrate?: boolean; // enable the gold "perfect" + amber "over" states
};

// Bright gold for a perfectly-hit target; soft amber for going over.
const GOLD = "#ffc800";
const AMBER = "#f59e0b";

export default function ProgressRing({
  value,
  target,
  color,
  size = 120,
  stroke = 11,
  label,
  unit,
  big = false,
  celebrate = true,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = target > 0 ? value / target : 0;
  const pct = Math.max(0, Math.min(1, ratio));
  const remaining = Math.round(target - value);

  // Dynamic state: celebrate when the target is hit perfectly; soften (not harsh
  // red) when over.
  const perfect = celebrate && ratio >= 0.97 && ratio <= 1.06;
  const over = celebrate && ratio > 1.06;
  const ringColor = perfect ? GOLD : over ? AMBER : color;
  const numberColor = perfect ? "#b88400" : over ? "#b45309" : "#0f172a";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${perfect ? "animate-pulse-glow" : ""}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#eef6e3"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{
              transition:
                "stroke-dashoffset 0.7s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-black tabular-nums leading-none ${big ? "text-4xl" : "text-2xl"}`}
            style={{ color: numberColor }}
          >
            {Math.round(value)}
          </span>
          <span className="mt-1 text-[11px] font-bold text-slate-400">
            / {Math.round(target)} {unit}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-extrabold text-slate-700">{label}</div>
        {perfect ? (
          <div className="text-xs font-extrabold text-sun-600">🎯 Goal hit!</div>
        ) : (
          <div className={`text-xs font-bold ${over ? "text-amber-600" : "text-slate-400"}`}>
            {over
              ? `${Math.abs(remaining)} ${unit} over`
              : `${Math.max(0, remaining)} ${unit} to go`}
          </div>
        )}
      </div>
    </div>
  );
}
