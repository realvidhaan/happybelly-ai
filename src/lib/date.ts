// Local-day date helpers. We key everything on YYYY-MM-DD in the user's own
// timezone so "today" matches what the user sees on their clock.

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(s: string, delta: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

export function daysBetween(a: string, b: string): number {
  const ms = parseDateStr(b).getTime() - parseDateStr(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDayLabel(s: string): string {
  const today = todayStr();
  if (s === today) return "Today";
  if (s === addDays(today, -1)) return "Yesterday";
  if (s === addDays(today, 1)) return "Tomorrow";
  return parseDateStr(s).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

// Single-letter weekday for the streak strip (always a weekday, never "Y"/"T"
// from relative labels like "Yesterday"/"Today").
export function weekdayInitial(s: string): string {
  return WEEKDAY_INITIALS[parseDateStr(s).getDay()];
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
