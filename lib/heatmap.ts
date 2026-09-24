export type HeatDay = { day: string; count: number };

export type MonthLabel = { column: number; label: string };

export type HeatGrid = {
  /** Celdas vacías al comienzo para que el primer día caiga en su fila (lunes = 0). */
  pad: number;
  weeks: number;
  max: number;
  /** 0 = sin actividad; 1..4 = de menos a más. */
  levels: number[];
  /** Columna (semana) de cada día en `days`, para ubicarlo en la grilla. */
  columns: number[];
  /** Una etiqueta por mes, en la columna donde ese mes empieza a aparecer. */
  monthLabels: MonthLabel[];
};

const MONTH_FORMAT = new Intl.DateTimeFormat("es", { month: "short" });

export function weekdayIndex(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  return (new Date(y, m - 1, d, 12).getDay() + 6) % 7;
}

function monthOf(dayKey: string): string {
  const [y, m] = dayKey.split("-").map(Number);
  return MONTH_FORMAT.format(new Date(y, m - 1, 1, 12));
}

export function level(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

export function buildHeatGrid(days: HeatDay[]): HeatGrid {
  const pad = days.length ? weekdayIndex(days[0].day) : 0;
  const max = days.reduce((m, d) => Math.max(m, d.count), 0);
  const columns = days.map((_, i) => Math.floor((pad + i) / 7));

  const monthLabels: MonthLabel[] = [];
  let lastMonth: string | null = null;
  days.forEach((d, i) => {
    const month = monthOf(d.day);
    if (month !== lastMonth) {
      monthLabels.push({ column: columns[i], label: month });
      lastMonth = month;
    }
  });

  return {
    pad,
    weeks: Math.ceil((pad + days.length) / 7),
    max,
    levels: days.map((d) => level(d.count, max)),
    columns,
    monthLabels,
  };
}
