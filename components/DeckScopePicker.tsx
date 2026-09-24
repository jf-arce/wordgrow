"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers3, ListFilter, Eye, X } from "lucide-react";
import clsx from "clsx";
import { DeckPicker, type DeckPickerDeck } from "@/components/DeckPicker";
import { deckColor } from "@/components/ui/DeckColor";
import type { StudySource } from "@/lib/study";
import type { ActionResult } from "@/app/actions/result";

export type DeckScopeValue = { deckScope: "all" | "selected"; deckIds: number[] };

/**
 * Selector de mazos compartido entre el dashboard ("Mazos para estudiar") y "Cómo
 * estudiás": botones "Todos los mazos" / "Elegir mazos" (que abre un dialog de
 * selección múltiple) y, debajo, los mazos activos con acceso directo a cada uno. Todo
 * se guarda al tocar — `onSave` hace el POST real con el resto de las preferencias de
 * estudio del que lo use.
 */
export function DeckScopePicker({
  decks,
  countsByDeck,
  value,
  onSave,
}: {
  decks: DeckPickerDeck[];
  countsByDeck: Record<number, Record<StudySource, number>>;
  value: DeckScopeValue;
  onSave: (next: DeckScopeValue) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const [draft, setDraft] = useState<DeckScopeValue>(value);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [dialogError, setDialogError] = useState("");

  async function persist(next: DeckScopeValue) {
    const result = await onSave(next);
    if (result.ok) router.refresh();
    return result;
  }

  async function selectAll() {
    if (value.deckScope === "all" || pending) return;
    setPending(true);
    setError("");
    try {
      const result = await persist({ deckScope: "all", deckIds: [] });
      if (!result.ok) setError(result.error);
    } catch {
      setError("No se pudo guardar. Intentá otra vez.");
    } finally {
      setPending(false);
    }
  }

  function openPicker() {
    setDraft(value.deckScope === "selected" ? value : { deckScope: "selected", deckIds: [] });
    setDialogError("");
    dialogRef.current?.showModal();
  }

  async function saveDraft() {
    if (draft.deckIds.length === 0 || pending) return;
    setPending(true);
    setDialogError("");
    try {
      const result = await persist(draft);
      if (!result.ok) return setDialogError(result.error);
      dialogRef.current?.close();
    } catch {
      setDialogError("No se pudo guardar. Intentá otra vez.");
    } finally {
      setPending(false);
    }
  }

  const activeDecks = value.deckScope === "selected" ? decks.filter((d) => value.deckIds.includes(d.id)) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Mazos para estudiar">
        <button
          type="button"
          aria-pressed={value.deckScope === "all"}
          disabled={pending}
          className={clsx("btn dashboard-deck-choice", value.deckScope === "all" ? "btn-primary" : "btn-outline")}
          onClick={selectAll}
        >
          <Layers3 size={18} aria-hidden />
          Todos los mazos
        </button>
        <button
          type="button"
          aria-pressed={value.deckScope === "selected"}
          disabled={pending}
          className={clsx("btn dashboard-deck-choice", value.deckScope === "selected" ? "btn-primary" : "btn-outline")}
          onClick={openPicker}
        >
          <ListFilter size={18} aria-hidden />
          Elegir mazos
        </button>
      </div>

      {activeDecks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {activeDecks.map((d) => {
            const c = deckColor(d.color);
            const due = countsByDeck[d.id]?.due ?? 0;
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-line px-3 py-2 sm:flex-nowrap"
              >
                <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${c.dot}`} />
                <span className="min-w-0 flex-1 basis-full truncate text-sm font-semibold sm:basis-auto">{d.name}</span>
                {due > 0 && <span className="shrink-0 text-xs text-ink-soft">{due} pendientes</span>}
                <Link
                  href={`/mazos/${d.id}`}
                  className="btn btn-quiet btn-small ml-auto shrink-0 gap-1.5"
                  aria-label={`Ver mazo ${d.name}`}
                >
                  <Eye size={14} aria-hidden />
                  Ver mazo
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-berry-ink">
          {error}
        </p>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        className="m-auto w-[min(64rem,calc(100%-1rem))] max-w-none max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-3xl border border-line bg-paper p-4 text-ink shadow-soft backdrop:bg-ink/40 sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id={dialogTitleId} className="text-2xl font-bold">
              Elegir mazos
            </h2>
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
        />
        <div className="sticky -bottom-4 mt-6 border-t border-line bg-paper pt-4 pb-1 sm:-bottom-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-soft">
              {draft.deckIds.length} {draft.deckIds.length === 1 ? "seleccionado" : "seleccionados"}
            </p>
            {dialogError && (
              <p role="alert" className="text-sm text-berry-ink">
                {dialogError}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <button type="button" className="btn btn-quiet w-full sm:w-auto" onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary w-full sm:w-auto"
              disabled={draft.deckIds.length === 0 || pending}
              onClick={saveDraft}
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
