import { buildHeatGrid, type HeatDay } from "@/lib/heatmap";

const LEVEL_MIX = [0, 30, 55, 80, 100];
const ROW_LABELS = ["Lun", "", "Mié", "", "Vie", "", ""];

const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const label = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return fmt.format(new Date(y, m - 1, d, 12));
};

/** Repasos por día en las últimas 12 semanas. Escala secuencial de un solo tono. */
export function Heatmap({ days }: { days: HeatDay[] }) {
  const grid = buildHeatGrid(days);
  const total = days.reduce((a, d) => a + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2">
          <div aria-hidden className="grid grid-rows-7 gap-1 pr-1 text-xs text-ink-soft">
            {ROW_LABELS.map((l, i) => (
              <span key={i} className="flex h-7 items-center">
                {l}
              </span>
            ))}
          </div>
          <div
            role="img"
            aria-label={`Repasos de las últimas 12 semanas: ${total} en ${activeDays} días con actividad`}
            className="grid grid-flow-col grid-rows-7 gap-1"
          >
            {Array.from({ length: grid.pad }, (_, i) => (
              <span key={`pad-${i}`} className="size-7" />
            ))}
            {days.map((d, i) => (
              <span
                key={d.day}
                title={`${label(d.day)}: ${d.count} ${d.count === 1 ? "repaso" : "repasos"}`}
                className="size-7 rounded-[6px]"
                style={{
                  background:
                    grid.levels[i] === 0
                      ? "var(--color-paper-2)"
                      : `color-mix(in oklab, var(--color-azure) ${LEVEL_MIX[grid.levels[i]]}%, var(--color-paper))`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <span>Menos</span>
        {LEVEL_MIX.map((mix, i) => (
          <span
            key={i}
            aria-hidden
            className="size-4 rounded-[4px]"
            style={{ background: i === 0 ? "var(--color-paper-2)" : `color-mix(in oklab, var(--color-azure) ${mix}%, var(--color-paper))` }}
          />
        ))}
        <span>Más</span>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Ver como tabla</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-paper text-ink-soft">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-semibold">Día</th>
                <th scope="col" className="px-3 py-1.5 text-right font-semibold">Repasos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...days].reverse().filter((d) => d.count > 0).map((d) => (
                <tr key={d.day}>
                  <th scope="row" className="px-3 py-1.5 font-normal">{label(d.day)}</th>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.count}</td>
                </tr>
              ))}
              {activeDays === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-ink-soft">Todavía no hay repasos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
