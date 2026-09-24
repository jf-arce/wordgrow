import type { WeekActivity } from "@/lib/db/queries/stats";

/** Repasos de los últimos 7 días, para no repetir la racha del sidebar y darle algo
 * de contexto propio al dashboard: ¿vengo siendo constante o me colgué? */
export function WeekActivityPanel({ week }: { week: WeekActivity }) {
  const max = Math.max(1, ...week.map((d) => d.count));
  const total = week.reduce((a, d) => a + d.count, 0);

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="text-sm font-semibold text-ink-soft">Repasos por día</p>
      <p className="text-sm text-ink-soft">
        {total === 0 ? (
          "Todavía no repasaste esta semana"
        ) : (
          <>
            <span className="font-display text-2xl font-extrabold text-ink">{total}</span>{" "}
            {total === 1 ? "repaso" : "repasos"} esta semana
          </>
        )}
      </p>
      <div className="flex items-end justify-between gap-1.5">
        {week.map((d) => {
          const label = weekdayLetter(d.day);
          const isToday = d.day === week[week.length - 1].day;
          const height = d.count === 0 ? 4 : Math.round((d.count / max) * 28) + 4;
          return (
            <div
              key={d.day}
              title={`${weekdayName(d.day)}: ${d.count === 0 ? "sin repasos" : `${d.count} ${d.count === 1 ? "repaso" : "repasos"}`}`}
              className="flex flex-1 cursor-default flex-col items-center gap-1"
            >
              <div
                className={`w-full rounded-sm ${d.count > 0 ? "bg-gold-ink" : "bg-paper-2"}`}
                style={{ height }}
              />
              <span className={`text-xs ${isToday ? "font-semibold text-ink" : "text-ink-soft"}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function dateOf(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function weekdayLetter(day: string): string {
  return dateOf(day).toLocaleDateString("es-AR", { weekday: "narrow" }).toUpperCase();
}

function weekdayName(day: string): string {
  const name = dateOf(day).toLocaleDateString("es-AR", { weekday: "long" });
  return name.charAt(0).toUpperCase() + name.slice(1);
}
