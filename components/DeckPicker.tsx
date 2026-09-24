"use client";

import clsx from "clsx";
import type { StudySource } from "@/lib/study";
import { DeckStack } from "@/components/DeckStack";

export type DeckPickerDeck = { id: number; name: string; color: string; total: number };

/**
 * Selector de mazos: cartas multi-selección + "Todos". Sin navegación — los conteos
 * por fuente vienen precalculados (`countsByDeck`) para que cada click sea instantáneo
 * en vez de un round-trip al servidor por mazo tocado.
 */
export function DeckPicker({
  decks,
  countsByDeck,
  value,
  onChange,
  selectionOnly = false,
}: {
  decks: DeckPickerDeck[];
  countsByDeck: Record<number, Record<StudySource, number>>;
  value: { deckScope: "all" | "selected"; deckIds: number[] };
  onChange: (value: { deckScope: "all" | "selected"; deckIds: number[] }) => void;
  selectionOnly?: boolean;
}) {
  const allSelected = value.deckScope === "all";

  function toggle(id: number) {
    if (value.deckIds.includes(id)) {
      onChange({ deckScope: "selected", deckIds: value.deckIds.filter((v) => v !== id) });
    } else {
      onChange({ deckScope: "selected", deckIds: [...value.deckIds, id] });
    }
  }

  return (
    <div>
      {!selectionOnly && <p className="mb-2 font-semibold">Mazos</p>}
      <div
        className={clsx(
          selectionOnly ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-4",
        )}
        role="group"
        aria-label="Elegir mazos"
      >
        {!selectionOnly && (
          <button
            type="button"
            onClick={() => onChange({ deckScope: "all", deckIds: [] })}
            aria-pressed={allSelected}
            className={clsx("deck-option deck-option-all", allSelected && "deck-option-selected")}
          >
            Todos los mazos
          </button>
        )}
        {decks.map((d) => {
          const selected = value.deckScope === "selected" && value.deckIds.includes(d.id);
          const due = countsByDeck[d.id]?.due ?? 0;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggle(d.id)}
              aria-pressed={selected}
              className={clsx(
                "deck-option",
                selectionOnly && "deck-option-row",
                selected && "deck-option-selected",
              )}
            >
              <DeckStack name={d.name} color={d.color} total={d.total} compact />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="line-clamp-2 max-w-full text-sm font-bold wrap-anywhere">{d.name}</span>
                {due > 0 && <span className="text-xs opacity-70">{due} para repasar</span>}
              </span>
            </button>
          );
        })}
      </div>
      {!selectionOnly && value.deckScope === "selected" && value.deckIds.length === 0 && <p role="alert" className="mt-2 text-sm text-berry-ink">Elegí al menos un mazo o seleccioná todos.</p>}
    </div>
  );
}
