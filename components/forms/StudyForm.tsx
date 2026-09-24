"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { saveStudyPrefsAction } from "@/app/actions/settings";
import { MODE_LABELS, type StudyMode } from "@/lib/quiz";
import { SOURCE_LABELS, type StudySource } from "@/lib/study";
import type { StudyPrefsInput } from "@/lib/schemas";
import { DeckPicker, type DeckPickerDeck } from "@/components/DeckPicker";
import { Button } from "@/components/ui/NeoButton";

const MODES: { value: StudyMode; hint: string }[] = [
  { value: "mixed", hint: "Empieza fácil y sube la dificultad según cuánto sabés cada carta." },
  { value: "choice", hint: "Ves la palabra y elegís su significado entre 2 y 4 opciones." },
  { value: "reverse", hint: "Ves el significado y elegís la palabra entre 2 y 4 opciones." },
  { value: "typed", hint: "Ves el significado y escribís la palabra." },
  { value: "cloze", hint: "Completás la oración con la palabra que falta." },
  { value: "flashcard", hint: "Das vuelta la tarjeta y decís si la sabías." },
];

const SOURCE_HINTS: Record<StudySource, string> = {
  due: "Las que ya toca repasar según tu progreso.",
  all: "Todas las del mazo, en orden aleatorio.",
  hard: "Las que fallaste o siguen en las primeras etapas.",
  new: "Las que nunca repasaste.",
};

function sumCounts(
  countsByDeck: Record<number, Record<StudySource, number>>,
  deckIds: number[],
  deckScope: "all" | "selected",
): Record<StudySource, number> {
  const ids = deckScope === "all" ? Object.keys(countsByDeck).map(Number) : deckIds;
  const total: Record<StudySource, number> = { due: 0, all: 0, hard: 0, new: 0 };
  for (const id of ids) {
    const c = countsByDeck[id];
    if (!c) continue;
    total.due += c.due;
    total.all += c.all;
    total.hard += c.hard;
    total.new += c.new;
  }
  return total;
}

/** Configuración de estudio. El estudio se inicia desde el menú principal. */
export function StudyForm({
  decks,
  countsByDeck,
  defaults,
  initialDirty = false,
}: {
  decks: DeckPickerDeck[];
  countsByDeck: Record<number, Record<StudySource, number>>;
  defaults: StudyPrefsInput;
  initialDirty?: boolean;
}) {
  const sources = Object.keys(SOURCE_LABELS) as StudySource[];

  const [selection, setSelection] = useState({ deckIds: defaults.deckIds, deckScope: defaults.deckScope });
  const [source, setSource] = useState<StudySource>(defaults.source);
  const [mode, setMode] = useState<StudyMode>(defaults.mode);
  const [limit, setLimit] = useState(defaults.limit);
  const [dirty, setDirty] = useState(initialDirty);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const counts = useMemo(() => sumCounts(countsByDeck, selection.deckIds, selection.deckScope), [countsByDeck, selection]);
  const nothing = counts.all === 0;

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
      setSaved(false);
      setError("");
    };
  }

  async function save() {
    if (selection.deckScope === "selected" && selection.deckIds.length === 0) return setError("Elegí al menos un mazo.");
    setPending(true);
    try {
      const result = await saveStudyPrefsAction({ source, mode, limit, ...selection });
      if (!result.ok) return setError(result.error);
      setDirty(false);
      setSaved(true);
    } catch {
      setError("No se pudo guardar. Intentá otra vez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {decks.length > 0 && <DeckPicker decks={decks} countsByDeck={countsByDeck} value={selection} onChange={markDirty(setSelection)} />}

      <fieldset>
        <legend className="mb-2 font-semibold">Qué cartas</legend>
        <div className="grid gap-2">
          {sources.map((s) => (
            <label
              key={s}
              className="surface flex cursor-pointer items-start gap-3 p-4 has-checked:border-primary has-checked:bg-azure-soft has-focus-visible:outline-3 has-focus-visible:outline-(--focus) has-disabled:cursor-not-allowed has-disabled:opacity-60"
            >
              <input
                type="radio"
                name="source"
                value={s}
                checked={s === source}
                onChange={() => markDirty(setSource)(s)}
                className="mt-1.5 size-4 accent-primary"
              />
              <span>
                <span className="block font-semibold">
                  {SOURCE_LABELS[s]} <span className="font-normal text-ink-soft">({counts[s]})</span>
                </span>
                <span className="text-sm text-ink-soft">{SOURCE_HINTS[s]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-semibold">Modo</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className="surface flex cursor-pointer items-start gap-3 p-4 has-checked:border-primary has-checked:bg-azure-soft has-focus-visible:outline-3 has-focus-visible:outline-(--focus)"
            >
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={m.value === mode}
                onChange={() => markDirty(setMode)(m.value)}
                className="mt-1.5 size-4 accent-primary"
              />
              <span>
                <span className="block font-semibold">{MODE_LABELS[m.value]}</span>
                <span className="text-sm text-ink-soft">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="limit" className="mb-1.5 block font-semibold">
          Cantidad de preguntas
        </label>
        <input
          id="limit"
          type="number"
          min={1}
          max={100}
          value={limit}
          onChange={(e) => markDirty(setLimit)(Number(e.target.value))}
          className="field-input max-w-48"
        />
        <div className="mt-2 flex gap-2">{[10,20,30,50].map((n) => <button type="button" key={n} className="btn btn-outline btn-sm" onClick={() => markDirty(setLimit)(n)}>{n}</button>)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" disabled={!dirty || pending || limit < 1 || limit > 100} onClick={save}>
          <Save size={20} aria-hidden />
          {pending ? "Guardando…" : "Guardar configuración"}
        </Button>
        {error && <p role="alert" className="text-berry-ink">{error}</p>}
        {saved && (
          <div role="status" className="alert alert-success w-auto py-2">
            <span>Guardado.</span>
          </div>
        )}
      </div>
      {nothing && <p className="text-ink-soft">Esta selección no tiene cartas todavía. Podés guardarla para más adelante.</p>}
      {!nothing && counts[source] === 0 && <p className="text-ink-soft">Esta fuente no tiene cartas ahora. Podés guardar la elección, pero necesitarás cartas disponibles para estudiar.</p>}
    </div>
  );
}
