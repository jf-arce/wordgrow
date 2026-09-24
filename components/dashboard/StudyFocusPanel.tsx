import Link from "next/link";
import { KIND_LABELS, CARD_KINDS, type CardKind } from "@/lib/quiz";
import { KIND_STYLE } from "@/lib/cardKind";
import { KindGlyph } from "@/components/card/KindGlyph";
import { deckColor } from "@/components/ui/DeckColor";
import type { StudyFocus } from "@/lib/db/queries/stats";

/** Qué se está estudiando: distribución de cartas por tipo + mazos con actividad en los
 * últimos 7 días. Le da al usuario una foto rápida de dónde está parado. */
export function StudyFocusPanel({ focus }: { focus: StudyFocus }) {
  const total = CARD_KINDS.reduce((a, k) => a + focus.byKind[k], 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink-soft">Tipos de carta</p>
        {total === 0 ? (
          <p className="text-ink-soft">Todavía no hay cartas.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {CARD_KINDS.filter((k) => focus.byKind[k] > 0).map((k) => (
              <KindRow key={k} kind={k} count={focus.byKind[k]} total={total} />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-soft">Mazos en rotación (últimos 7 días)</p>
        {focus.activeDecks.length === 0 ? (
          <p className="text-ink-soft">Todavía no repasaste esta semana.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {focus.activeDecks.map((d) => {
              const c = deckColor(d.color);
              return (
                <li key={d.id} className="flex items-center gap-2">
                  <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${c.dot}`} />
                  <Link href={`/mazos/${d.id}`} className="min-w-0 flex-1 truncate hover:underline">
                    {d.name}
                  </Link>
                  {d.due > 0 && <span className="shrink-0 text-sm text-ink-soft">{d.due} pendientes</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function KindRow({ kind, count, total }: { kind: CardKind; count: number; total: number }) {
  const style = KIND_STYLE[kind];
  const pct = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style.soft} ${style.ink}`}>
        <KindGlyph kind={kind} size={12} />
        {KIND_LABELS[kind]}
      </span>
      <div className={`h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2 ${style.ink}`}>
        <div className="h-full rounded-full bg-current" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-ink-soft">{count}</span>
    </div>
  );
}
