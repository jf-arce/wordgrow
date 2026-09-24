"use client";

import { DeckScopePicker, type DeckScopeValue } from "@/components/DeckScopePicker";
import type { DeckPickerDeck } from "@/components/DeckPicker";
import { saveStudyPrefsAction } from "@/app/actions/settings";
import type { StudySource } from "@/lib/study";
import type { StudyMode } from "@/lib/quiz";

/** Selector de mazos del inicio. Comparte las preferencias con la pantalla de configuración. */
export function StudyShortcut({
  decks,
  countsByDeck,
  savedDeckIds,
  savedDeckScope,
  savedSource,
  savedMode,
  savedLimit,
}: {
  decks: DeckPickerDeck[];
  countsByDeck: Record<number, Record<StudySource, number>>;
  savedDeckIds: number[];
  savedDeckScope: "all" | "selected";
  savedSource: StudySource;
  savedMode: StudyMode;
  savedLimit: number;
}) {
  async function save(next: DeckScopeValue) {
    return saveStudyPrefsAction({ source: savedSource, mode: savedMode, limit: savedLimit, ...next });
  }

  return (
    <DeckScopePicker
      decks={decks}
      countsByDeck={countsByDeck}
      value={{ deckScope: savedDeckScope, deckIds: savedDeckIds }}
      onSave={save}
    />
  );
}
