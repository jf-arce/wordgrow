"use client";

import Link from "next/link";
import clsx from "clsx";
import { Eye } from "lucide-react";
import type { StudySource } from "@/lib/study";
import { DeckStack } from "@/components/DeckStack";

export type DeckPickerDeck = { id: number; name: string; color: string; total: number };

/**
 * Selector de mazos multi-selección, para usar dentro del dialog de `DeckScopePicker`.
 * Sin navegación para elegir — los conteos por fuente vienen precalculados
 * (`countsByDeck`) para que cada click sea instantáneo en vez de un round-trip al
 * servidor por mazo tocado. Cada fila tiene además un ícono "Ver mazo" que sí navega,
 * para repasar qué contiene un mazo antes (o después) de elegirlo.
 */
export function DeckPicker({
  decks,
  countsByDeck,
  value,
  onChange,
}: {
  decks: DeckPickerDeck[];
  countsByDeck: Record<number, Record<StudySource, number>>;
  value: { deckScope: "all" | "selected"; deckIds: number[] };
  onChange: (value: { deckScope: "all" | "selected"; deckIds: number[] }) => void;
}) {
  function toggle(id: number) {
    if (value.deckIds.includes(id)) {
      onChange({ deckScope: "selected", deckIds: value.deckIds.filter((v) => v !== id) });
    } else {
      onChange({ deckScope: "selected", deckIds: [...value.deckIds, id] });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Elegir mazos">
        {decks.map((d) => {
          const selected = value.deckScope === "selected" && value.deckIds.includes(d.id);
          const due = countsByDeck[d.id]?.due ?? 0;
          return (
            <div
              key={d.id}
              className={clsx(
                "deck-option deck-option-row relative has-focus-visible:outline-3 has-focus-visible:outline-(--focus)",
                selected && "deck-option-selected",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(d.id)}
                aria-pressed={selected}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <DeckStack name={d.name} color={d.color} total={d.total} compact />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="line-clamp-2 max-w-full text-sm font-bold wrap-anywhere">{d.name}</span>
                  {due > 0 && <span className="text-xs opacity-70">{due} para repasar</span>}
                </span>
              </button>
              <Link
                href={`/mazos/${d.id}`}
                aria-label={`Ver mazo ${d.name}`}
                className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-line text-ink-soft hover:bg-paper-2"
              >
                <Eye size={18} aria-hidden />
              </Link>
            </div>
          );
        })}
      </div>
      {value.deckScope === "selected" && value.deckIds.length === 0 && (
        <p role="alert" className="mt-2 text-sm text-berry-ink">
          Elegí al menos un mazo.
        </p>
      )}
    </div>
  );
}
