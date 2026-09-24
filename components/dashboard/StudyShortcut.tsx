"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers3, ListFilter, Save, X } from "lucide-react";
import clsx from "clsx";
import { DeckPicker, type DeckPickerDeck } from "@/components/DeckPicker";
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
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const [selection, setSelection] = useState({ deckIds: savedDeckIds, deckScope: savedDeckScope });
  const [draft, setDraft] = useState({ deckIds: savedDeckIds, deckScope: "selected" as const });
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (next: typeof selection) => {
    setSelection(next);
    setDirty(true);
    setMessage("");
  };

  function openPicker() {
    setDraft({ deckScope: "selected", deckIds: selection.deckScope === "selected" ? selection.deckIds : [] });
    dialogRef.current?.showModal();
  }

  function applyPicker() {
    if (draft.deckIds.length === 0) return;
    handleChange(draft);
    dialogRef.current?.close();
  }

  async function save() {
    setPending(true);
    try {
      const result = await saveStudyPrefsAction({ source: savedSource, mode: savedMode, limit: savedLimit, ...selection });
      setMessage(result.ok ? "Selección guardada." : result.error);
      if (result.ok) {
        setDirty(false);
        router.refresh();
      }
    } catch {
      setMessage("No se pudo guardar. Intentá otra vez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Mazos para estudiar">
        <button
          type="button"
          aria-pressed={selection.deckScope === "all"}
          className={clsx("btn dashboard-deck-choice", selection.deckScope === "all" ? "btn-primary" : "btn-outline")}
          onClick={() => handleChange({ deckScope: "all", deckIds: [] })}
        >
          <Layers3 size={18} aria-hidden />
          Todos los mazos
        </button>
        <button
          type="button"
          aria-pressed={selection.deckScope === "selected"}
          className={clsx("btn dashboard-deck-choice", selection.deckScope === "selected" ? "btn-primary" : "btn-outline")}
          onClick={openPicker}
        >
          <ListFilter size={18} aria-hidden />
          Elegir mazos
        </button>
      </div>
      {selection.deckScope === "selected" && (
        <p className="text-sm text-ink-soft">
          {selection.deckIds.length} {selection.deckIds.length === 1 ? "mazo seleccionado" : "mazos seleccionados"}
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!dirty || pending || (selection.deckScope === "selected" && selection.deckIds.length === 0)}
        onClick={save}
      >
        <Save size={18} aria-hidden />
        <span className="grid">
          <span className="invisible col-start-1 row-start-1" aria-hidden="true">Guardar mazos</span>
          <span className="col-start-1 row-start-1">{pending ? "Guardando…" : "Guardar mazos"}</span>
        </span>
      </button>
      {dirty && <p className="text-sm text-ink-soft">Guardá la selección para usarla al estudiar.</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        className="m-auto w-[min(64rem,calc(100%-1rem))] max-w-none max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-3xl border border-line bg-paper p-4 text-ink shadow-soft backdrop:bg-ink/40 sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id={dialogTitleId} className="text-2xl font-bold">Elegir mazos</h2>
            <p className="mt-1 text-sm text-ink-soft">Podés combinar los mazos que quieras para estudiar.</p>
          </div>
          <button type="button" className="btn btn-quiet btn-sm" aria-label="Cerrar" onClick={() => dialogRef.current?.close()}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <DeckPicker
          decks={decks}
          countsByDeck={countsByDeck}
          value={draft}
          onChange={(next) => setDraft({ deckScope: "selected", deckIds: next.deckIds })}
          selectionOnly
        />
        <div className="sticky -bottom-4 mt-6 border-t border-line bg-paper pt-4 pb-1 sm:-bottom-7">
          <p className="mb-3 text-sm text-ink-soft">{draft.deckIds.length} {draft.deckIds.length === 1 ? "seleccionado" : "seleccionados"}</p>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <button type="button" className="btn btn-quiet w-full sm:w-auto" onClick={() => dialogRef.current?.close()}>Cancelar</button>
            <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={draft.deckIds.length === 0} onClick={applyPicker}>Aplicar</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
