"use client";

import { Tooltip as RechartsTooltip } from "recharts";
import type { WeekActivity } from "@/lib/db/queries/stats";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";

/** Repasos de los últimos 7 días, para no repetir la racha del sidebar y darle algo
 * de contexto propio al dashboard: ¿vengo siendo constante o me colgué? */
export function WeekActivityPanel({ week }: { week: WeekActivity }) {
  const total = week.reduce((a, d) => a + d.count, 0);

  const data = week.map((d) => ({
    letter: weekdayLetter(d.day),
    dayLabel: weekdayName(d.day),
    count: d.count,
  }));

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
      <EvilBarChart
        data={data}
        config={{ count: { label: "Repasos", colors: { light: ["var(--gold-ink)"] } } }}
        className="h-28 w-full flex-none aspect-auto"
        barRadius={4}
      >
        <EvilBarChart.XAxis
          dataKey="dayLabel"
          tickFormatter={(_, index) => data[index]?.letter ?? ""}
          tick={{ fill: "var(--color-ink-soft)" }}
        />
        <RechartsTooltip cursor={false} content={<TooltipContent />} />
        <EvilBarChart.Bar dataKey="count" variant="gradient" />
      </EvilBarChart>
    </div>
  );
}

function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { dayLabel: string; count: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const { dayLabel, count } = payload[0].payload;
  const text = count === 0 ? "sin repasos" : `${count} ${count === 1 ? "repaso" : "repasos"}`;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <span className="font-medium">{dayLabel}</span>: {text}
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
