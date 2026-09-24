const DAY_MS = 24 * 60 * 60 * 1000;

/** Clave YYYY-MM-DD en hora local. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Días seguidos con al menos un repaso. Si hoy todavía no repasaste,
 * la racha sigue viva mientras hayas repasado ayer.
 */
export function computeStreak(activeDays: ReadonlySet<string>, now: number): number {
  let cursor = now;
  if (!activeDays.has(dayKey(cursor))) cursor -= DAY_MS;
  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak++;
    cursor -= DAY_MS;
  }
  return streak;
}

export function bestStreak(activeDays: ReadonlySet<string>): number {
  const sorted = [...activeDays].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const key of sorted) {
    const [y, m, d] = key.split("-").map(Number);
    const ms = new Date(y, m - 1, d, 12).getTime();
    run = prev !== null && Math.round((ms - prev) / DAY_MS) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = ms;
  }
  return best;
}
