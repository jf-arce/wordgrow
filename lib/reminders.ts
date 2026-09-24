/**
 * Lógica pura de recordatorios: qué días tocan y cuándo es el próximo. Sin DOM ni
 * Notification acá, para poder testearla sin un navegador.
 */

export type ReminderPrefs = {
  enabled: boolean;
  /** Días de la semana en que se quiere practicar: 0 = domingo … 6 = sábado. */
  days: number[];
  /** Hora local en formato "HH:MM". */
  time: string;
};

export const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  enabled: false,
  days: [1, 2, 3, 4, 5], // lunes a viernes
  time: "19:00",
};

/** Preajustes de frecuencia: "todos los días" o "N veces por semana", con días bien repartidos. */
export const FREQUENCY_PRESETS: { label: string; days: number[] }[] = [
  { label: "Todos los días", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "2 veces por semana", days: [1, 4] },
  { label: "3 veces por semana", days: [1, 3, 5] },
  { label: "4 veces por semana", days: [1, 2, 4, 5] },
  { label: "5 veces por semana", days: [1, 2, 3, 4, 5] },
  { label: "6 veces por semana", days: [1, 2, 3, 4, 5, 6] },
];

function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map(Number);
  return { h: Number.isFinite(h) ? h : 19, m: Number.isFinite(m) ? m : 0 };
}

export function isScheduledDay(prefs: ReminderPrefs, date: Date): boolean {
  return prefs.enabled && prefs.days.includes(date.getDay());
}

/** ¿Ya pasó la hora del recordatorio hoy? Sirve para el banner "hoy te toca practicar". */
export function isDueNow(prefs: ReminderPrefs, now: Date): boolean {
  if (!isScheduledDay(prefs, now)) return false;
  const { h, m } = parseTime(prefs.time);
  const scheduled = new Date(now);
  scheduled.setHours(h, m, 0, 0);
  return now >= scheduled;
}

/** Próximo momento (Date) en que toca el recordatorio, buscando hasta 7 días adelante. */
export function nextOccurrence(prefs: ReminderPrefs, now: Date): Date | null {
  if (!prefs.enabled || prefs.days.length === 0) return null;
  const { h, m } = parseTime(prefs.time);

  for (let add = 0; add <= 7; add++) {
    const day = new Date(now);
    day.setDate(day.getDate() + add);
    day.setHours(h, m, 0, 0);
    if (prefs.days.includes(day.getDay()) && day.getTime() > now.getTime()) {
      return day;
    }
  }
  return null;
}

/** Milisegundos hasta el próximo recordatorio, para programar un timeout. Null si está apagado. */
export function msUntilNext(prefs: ReminderPrefs, now: Date): number | null {
  const next = nextOccurrence(prefs, now);
  return next ? next.getTime() - now.getTime() : null;
}
