const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Cuándo toca repasar una tarjeta, en palabras. */
export function formatDue(dueAt: number, { reps = 1, now = Date.now() }: { reps?: number; now?: number } = {}): string {
  if (reps === 0) return "Sin repasar todavía";
  const diff = dueAt - now;
  if (diff <= 0) return "Toca repasar";
  if (diff < HOUR) return "Vuelve en menos de una hora";
  if (diff < DAY) return "Vuelve hoy";
  const days = Math.round(diff / DAY);
  if (days <= 1) return "Vuelve mañana";
  if (days < 30) return `Vuelve en ${days} días`;
  const months = Math.round(days / 30);
  return `Vuelve en ${months} ${months === 1 ? "mes" : "meses"}`;
}
