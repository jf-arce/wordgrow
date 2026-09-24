"use client";

import { MODES, SOURCE_HINTS, LIMIT_OPTIONS } from "@/lib/study-options";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import clsx from "clsx";
import { saveStudyPrefsAction } from "@/app/actions/settings";
import { MODE_LABELS, type StudyMode } from "@/lib/quiz";
import { SOURCE_LABELS, type StudySource } from "@/lib/study";
import type { StudyPrefsInput } from "@/lib/schemas";
import { DeckScopePicker, type DeckScopeValue } from "@/components/DeckScopePicker";
import type { DeckPickerDeck } from "@/components/DeckPicker";
import { ConfirmButton } from "@/components/ui/ConfirmButton";


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

function sameIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

/** Configuración de estudio: todo se guarda solo al tocarlo. El estudio se inicia desde
 * el menú principal. */
export function StudyForm({
  decks,
  countsByDeck,
  defaults,
  defaultPrefs,
  autoSaveDeckOnMount = false,
}: {
  decks: DeckPickerDeck[];
  countsByDeck: Record<number, Record<StudySource, number>>;
  defaults: StudyPrefsInput;
  /** Configuración de fábrica (`DEFAULT_STUDY_PREFS`): la page la pasa como prop porque
   * `lib/db/queries/settings.ts` es `server-only`. */
  defaultPrefs: StudyPrefsInput;
  /** Con `?deck=N` la page precarga ese mazo en `defaults` sin haberlo guardado todavía;
   * acá se guarda apenas se monta, para no depender de que el usuario toque algo. */
  autoSaveDeckOnMount?: boolean;
}) {
  const router = useRouter();
  const sources = Object.keys(SOURCE_LABELS) as StudySource[];
  const limitOptions = LIMIT_OPTIONS.includes(defaults.limit) ? LIMIT_OPTIONS : [...LIMIT_OPTIONS, defaults.limit].sort((a, b) => a - b);

  const [selection, setSelection] = useState<DeckScopeValue>({ deckIds: defaults.deckIds, deckScope: defaults.deckScope });
  const [source, setSource] = useState<StudySource>(defaults.source);
  const [mode, setMode] = useState<StudyMode>(defaults.mode);
  const [limit, setLimit] = useState(defaults.limit);
  const [pendingField, setPendingField] = useState<"source" | "mode" | "limit" | null>(null);
  const [status, setStatus] = useState<{ kind: "saved" | "error"; message?: string } | null>(null);
  const autoSaved = useRef(false);

  const counts = useMemo(() => sumCounts(countsByDeck, selection.deckIds, selection.deckScope), [countsByDeck, selection]);
  const nothing = counts.all === 0;

  const isDefaultPrefs =
    selection.deckScope === defaultPrefs.deckScope &&
    (selection.deckScope === "all" || sameIds(selection.deckIds, defaultPrefs.deckIds)) &&
    source === defaultPrefs.source &&
    mode === defaultPrefs.mode &&
    limit === defaultPrefs.limit;

  async function persistField(patch: Partial<StudyPrefsInput>, field: "source" | "mode" | "limit") {
    setPendingField(field);
    setStatus(null);
    try {
      const result = await saveStudyPrefsAction({ source, mode, limit, ...selection, ...patch });
      if (!result.ok) return setStatus({ kind: "error", message: result.error });
      setStatus({ kind: "saved" });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "No se pudo guardar. Intentá otra vez." });
    } finally {
      setPendingField(null);
    }
  }

  function changeSource(s: StudySource) {
    setSource(s);
    persistField({ source: s }, "source");
  }
  function changeMode(m: StudyMode) {
    setMode(m);
    persistField({ mode: m }, "mode");
  }
  function changeLimit(n: number) {
    setLimit(n);
    persistField({ limit: n }, "limit");
  }

  async function saveDeckScope(next: DeckScopeValue) {
    const result = await saveStudyPrefsAction({ source, mode, limit, ...next });
    if (result.ok) {
      setSelection(next);
      setStatus({ kind: "saved" });
    }
    return result;
  }

  async function resetToDefaults() {
    setStatus(null);
    try {
      const result = await saveStudyPrefsAction(defaultPrefs);
      if (!result.ok) return setStatus({ kind: "error", message: result.error });
      setSelection({ deckScope: defaultPrefs.deckScope, deckIds: defaultPrefs.deckIds });
      setSource(defaultPrefs.source);
      setMode(defaultPrefs.mode);
      setLimit(defaultPrefs.limit);
      setStatus({ kind: "saved" });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "No se pudo guardar. Intentá otra vez." });
    }
  }

  useEffect(() => {
    if (!autoSaveDeckOnMount || autoSaved.current) return;
    autoSaved.current = true;
    saveDeckScope(selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {decks.length > 0 && <DeckScopePicker decks={decks} countsByDeck={countsByDeck} value={selection} onSave={saveDeckScope} />}

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
                disabled={pendingField === "source"}
                onChange={() => changeSource(s)}
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
                disabled={pendingField === "mode"}
                onChange={() => changeMode(m.value)}
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

      <fieldset>
        <legend className="mb-2 font-semibold">Cantidad de preguntas</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cantidad de preguntas">
          {limitOptions.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === limit}
              disabled={pendingField === "limit"}
              className={clsx("btn btn-sm", n === limit ? "btn-primary" : "btn-outline")}
              onClick={() => changeLimit(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton
          title="¿Volver a la configuración por defecto?"
          description="Se reemplaza tu configuración actual (mazos elegidos, qué cartas, modo y cantidad) por la de fábrica: todos los mazos, cartas para repasar, modo mixto y 20 preguntas."
          confirmLabel="Restablecer"
          onConfirm={resetToDefaults}
          disabled={isDefaultPrefs}
          className="btn btn-quiet"
        >
          <RotateCcw size={18} aria-hidden />
          Restablecer
        </ConfirmButton>
        {status?.kind === "saved" && (
          <p role="status" className="text-sm font-semibold text-azure-strong">
            Guardado.
          </p>
        )}
        {status?.kind === "error" && (
          <p role="alert" className="text-sm text-berry-ink">
            {status.message}
          </p>
        )}
      </div>
      {nothing && <p className="text-ink-soft">Esta selección no tiene cartas todavía. Podés dejarla guardada para más adelante.</p>}
      {!nothing && counts[source] === 0 && <p className="text-ink-soft">Esta fuente no tiene cartas ahora. Necesitarás cartas disponibles para estudiar.</p>}
    </div>
  );
}
