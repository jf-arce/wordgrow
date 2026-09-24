/** Precisión por mazo: una barra fina por mazo con el valor en la punta. Una sola serie, sin leyenda. */
export function AccuracyBars({
  decks,
}: {
  decks: { id: number; name: string; reviews: number; accuracy: number | null }[];
}) {
  return (
    <ul className="flex flex-col gap-4">
      {decks.map((d) => {
        const pct = d.accuracy === null ? null : Math.round(d.accuracy * 100);
        return (
          <li key={d.id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[12rem_1fr_4.5rem]">
            <span className="truncate font-semibold">{d.name}</span>
            <div
              role="img"
              aria-label={pct === null ? `${d.name}: sin repasos` : `${d.name}: ${pct}% de aciertos en ${d.reviews} repasos`}
              className="h-3 rounded-full bg-paper-2"
            >
              {pct !== null && (
                <div
                  className="h-full rounded-r-[4px] rounded-l-full bg-azure"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              )}
            </div>
            <span className="text-right tabular-nums text-ink-soft">
              {pct === null ? "Sin repasos" : <span className="font-semibold text-ink">{pct}%</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
