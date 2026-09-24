import { buildHeatGrid, type HeatDay } from "@/lib/heatmap";

const LEVEL_MIX = [0, 30, 55, 80, 100];
const ROW_LABELS = ["Lun", "", "Mié", "", "Vie", "", ""];

const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const label = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return fmt.format(new Date(y, m - 1, d, 12));
};

function levelColor(lvl: number) {
  return lvl === 0
    ? "var(--color-paper-2)"
    : `color-mix(in oklab, var(--color-azure) ${LEVEL_MIX[lvl]}%, var(--color-paper))`;
}

/** Repasos por día en las últimas 12 semanas, al estilo GitHub: una celda por día,
 * agrupadas en columnas por semana, con etiquetas de mes y tooltip real al hover/foco. */
export function Heatmap({ days }: { days: HeatDay[] }) {
  const grid = buildHeatGrid(days);
  const total = days.reduce((a, d) => a + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;
  const todayIndex = days.length - 1;
  const columns = { gridTemplateColumns: `repeat(${grid.weeks}, minmax(0, 1fr))` };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto pt-7 pb-1">
        <div className="flex gap-2">
          <div aria-hidden className="grid shrink-0 grid-rows-7 gap-1 pr-1 pt-[1.35rem] text-xs text-ink-soft">
            {ROW_LABELS.map((l, i) => (
              <span key={i} className="flex h-full min-h-[1.1rem] items-center">
                {l}
              </span>
            ))}
          </div>
          <div className="min-w-[22rem] flex-1">
            <div aria-hidden className="mb-1 grid text-xs text-ink-soft" style={columns}>
              {grid.monthLabels.map((m) => (
                <span key={m.column} className="capitalize" style={{ gridColumnStart: m.column + 1 }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div
              role="img"
              aria-label={`Repasos de las últimas 12 semanas: ${total} en ${activeDays} días con actividad`}
              className="grid grid-flow-col grid-rows-7 gap-1"
              style={columns}
            >
              {Array.from({ length: grid.pad }, (_, i) => (
                <span key={`pad-${i}`} className="aspect-square min-h-[1.1rem]" />
              ))}
              {days.map((d, i) => (
                <button
                  key={d.day}
                  type="button"
                  tabIndex={0}
                  className="group relative aspect-square min-h-[1.1rem] cursor-default rounded-[5px] outline-none transition-transform hover:z-10 hover:scale-110 hover:ring-2 hover:ring-azure focus-visible:z-10 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-azure"
                  style={{
                    background: levelColor(grid.levels[i]),
                    outline: i === todayIndex ? "2px solid var(--color-ink-soft)" : undefined,
                    outlineOffset: i === todayIndex ? "1px" : undefined,
                  }}
                >
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 scale-95 whitespace-nowrap rounded-md border border-line bg-paper px-2 py-1 text-xs font-medium text-ink opacity-0 shadow-lg transition-[opacity,transform] duration-100 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                  >
                    {label(d.day)}: {d.count === 0 ? "sin repasos" : `${d.count} ${d.count === 1 ? "repaso" : "repasos"}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <span>Menos</span>
        {LEVEL_MIX.map((_, i) => (
          <span key={i} aria-hidden className="size-4 rounded-[4px]" style={{ background: levelColor(i) }} />
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
