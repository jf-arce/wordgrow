"use client";

import { Tooltip as RechartsTooltip } from "recharts";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";

const ROW_HEIGHT = 40;
const MIN_HEIGHT = 120;

/** Precisión por mazo: una barra horizontal por mazo, con tooltip al pasar el mouse. */
export function AccuracyBars({
  decks,
}: {
  decks: { id: number; name: string; reviews: number; accuracy: number | null }[];
}) {
  const data = decks.map((d) => ({
    name: d.name,
    pct: d.accuracy === null ? 0 : Math.round(d.accuracy * 100),
    reviews: d.reviews,
    hasData: d.accuracy !== null,
  }));

  return (
    <div style={{ height: Math.max(decks.length * ROW_HEIGHT, MIN_HEIGHT) }} className="w-full">
      <EvilBarChart
        data={data}
        config={{ pct: { label: "Aciertos", colors: { light: ["var(--color-azure)"] } } }}
        layout="horizontal"
        barRadius={4}
        className="h-full w-full flex-none aspect-auto"
      >
        <EvilBarChart.YAxis dataKey="name" width={120} tick={{ fill: "var(--color-ink)" }} />
        <EvilBarChart.XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
        <RechartsTooltip cursor={{ fill: "var(--color-paper-2)" }} content={<TooltipContent />} />
        <EvilBarChart.Bar dataKey="pct" variant="gradient" />
      </EvilBarChart>
    </div>
  );
}

function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; pct: number; reviews: number; hasData: boolean } }[];
}) {
  if (!active || !payload?.length) return null;
  const { name, pct, reviews, hasData } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <span className="font-medium">{name}</span>:{" "}
      {hasData ? `${pct}% de aciertos en ${reviews} ${reviews === 1 ? "repaso" : "repasos"}` : "sin repasos"}
    </div>
  );
}
