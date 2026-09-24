import Link from "next/link";
import { deckColor } from "@/components/ui/DeckColor";
import { KindDonut } from "@/components/dashboard/KindDonut";
import type { StudyFocus } from "@/lib/db/queries/stats";

/** Qué se está estudiando: distribución de cartas por tipo + mazos con actividad en los
 * últimos 7 días. Le da al usuario una foto rápida de dónde está parado. */
export function StudyFocusPanel({ focus }: { focus: StudyFocus }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink-soft">Tipos de carta</p>
        <KindDonut byKind={focus.byKind} />
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
