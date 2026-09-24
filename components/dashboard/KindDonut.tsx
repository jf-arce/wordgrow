"use client";

import { CARD_KINDS, KIND_LABELS, type CardKind } from "@/lib/quiz";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";

/** Color por tipo de carta para el donut, en las mismas variables CSS que ya respaldan
 * `KIND_STYLE` (badges de `components/cardKind.ts`) — se mantienen en sincro visual. */
const KIND_COLOR: Record<CardKind, string> = {
  word: "var(--color-azure-strong)",
  phrasal_verb: "var(--sky-ink)",
  collocation: "var(--rose-ink)",
  sentence: "var(--lilac-ink)",
  other: "var(--color-ink-soft)",
};

/** Distribución de cartas por tipo, como donut. Reemplaza las barras de progreso
 * verticales por algo que se puede hover para ver el detalle. */
export function KindDonut({ byKind }: { byKind: Record<CardKind, number> }) {
  const total = CARD_KINDS.reduce((a, k) => a + byKind[k], 0);
  const kinds = CARD_KINDS.filter((k) => byKind[k] > 0);

  if (total === 0) {
    return <p className="text-ink-soft">Todavía no hay cartas.</p>;
  }

  const data = kinds.map((k) => ({ kind: k, count: byKind[k] }));
  const config = Object.fromEntries(
    kinds.map((k) => [k, { label: KIND_LABELS[k], colors: { light: [KIND_COLOR[k]] } }]),
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-soft">
        <span className="font-display text-2xl font-extrabold text-ink">{total}</span>{" "}
        {total === 1 ? "carta" : "cartas"} en total
      </p>
      <EvilPieChart data={data} dataKey="count" nameKey="kind" config={config} className="h-52 w-full flex-none aspect-auto">
        <EvilPieChart.Legend isClickable />
        <EvilPieChart.Tooltip />
        <EvilPieChart.Pie innerRadius={44} outerRadius={72} paddingAngle={3} cornerRadius={6} isClickable />
      </EvilPieChart>
    </div>
  );
}
