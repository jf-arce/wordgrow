"use client";

import Link from "next/link";
import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importCardsAction } from "@/app/actions/cards";
import { parseImport } from "@/lib/import";
import { KIND_LABELS } from "@/lib/quiz";

export function ImportForm({ deckId, existing }: { deckId: number; existing: string[] }) {
  const router = useRouter();
  const textId = useId();
  const fileId = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => parseImport(text, existing), [text, existing]);
  const hasInput = text.trim().length > 0;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > 2_000_000) {
      setError("El archivo pesa más de 2 MB. Dividilo en partes más chicas.");
      return;
    }
    setText(await file.text());
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await importCardsAction({ deckId, rows: preview.rows });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/mazos/${deckId}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <details className="surface p-4 sm:p-5">
        <summary className="cursor-pointer font-semibold">¿Qué formato tiene que tener la lista?</summary>
        <div className="mt-3 space-y-2 text-ink-soft">
          <p>Una carta por línea. La palabra y el significado son obligatorios; después podés agregar ejemplo, notas y tipo, en ese orden. Separá las columnas con tabulación, punto y coma, coma, “ - ” o “ = ”.</p>
          <pre className="overflow-x-auto rounded-xl bg-paper-2 p-3 text-sm text-ink">{`give up - rendirse
look after; cuidar; She looks after her brother.
break the ice = romper el hielo
give in; ceder; Don't give in.; ; phrasal_verb`}</pre>
          <p>Para indicar el tipo, usá <code>word</code>, <code>phrasal_verb</code>, <code>collocation</code>, <code>sentence</code> u <code>other</code>. Si lo dejás vacío o el valor no coincide, se deduce de la palabra o frase. Revisá el tipo asignado en la vista previa.</p>
          <p>Podés pegar la lista o subir un archivo CSV, TSV o TXT de hasta 2 MB. Se omiten las palabras repetidas en la lista o en el mazo, y podés importar hasta 2000 cartas por vez. Si la primera columna de la primera fila dice “term” o “palabra”, esa fila se ignora.</p>
        </div>
      </details>

      <div>
        <label htmlFor={textId} className="mb-1.5 block font-semibold">
          Pegá tu lista
        </label>
        <textarea
          id={textId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="field-input font-mono text-sm"
          rows={9}
          spellCheck={false}
          placeholder={"give up - rendirse\nlook after - cuidar"}
        />
      </div>

      <div>
        <label htmlFor={fileId} className="mb-1.5 block font-semibold">
          O subí un archivo CSV o de texto
        </label>
        <input
          id={fileId}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-azure-soft file:px-4 file:py-1.5 file:font-semibold file:text-azure-strong"
        />
      </div>

      {hasInput && (
        <section aria-labelledby="preview-titulo" className="flex flex-col gap-4">
          <h2 id="preview-titulo" className="text-xl font-bold">
            Vista previa
          </h2>
          <p aria-live="polite" className="text-ink-soft">
            <span className="font-semibold text-ink">{preview.rows.length}</span> para importar
            {preview.duplicates.length > 0 && <> · {preview.duplicates.length} repetidas (se omiten)</>}
            {preview.invalid.length > 0 && <> · {preview.invalid.length} con problemas</>}
          </p>

          {preview.rows.length > 0 && (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left">
                <thead>
                  <tr className="border-b border-line text-sm text-ink-soft">
                    <th scope="col" className="px-4 py-2 font-semibold">Palabra</th>
                    <th scope="col" className="px-4 py-2 font-semibold">Significado</th>
                    <th scope="col" className="px-4 py-2 font-semibold">Ejemplo</th>
                    <th scope="col" className="px-4 py-2 font-semibold">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.rows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <th scope="row" className="px-4 py-2 font-semibold">{r.term}</th>
                      <td className="px-4 py-2">{r.meaning}</td>
                      <td className="px-4 py-2 text-ink-soft">{r.example}</td>
                      <td className="px-4 py-2 text-ink-soft">{KIND_LABELS[r.kind]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 50 && (
                <p className="border-t border-line px-4 py-2 text-sm text-ink-soft">
                  y {preview.rows.length - 50} más…
                </p>
              )}
            </div>
          )}

          {preview.invalid.length > 0 && (
            <div className="rounded-2xl bg-berry-soft p-4 text-berry-ink">
              <p className="font-semibold">Estas líneas no se pueden importar:</p>
              <ul className="mt-1 list-disc pl-5">
                {preview.invalid.slice(0, 8).map((l) => (
                  <li key={l.line}>
                    Línea {l.line}: {l.reason} (“{l.raw.slice(0, 40)}”)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {error && (
        <p role="alert" className="font-medium text-berry-ink">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" disabled={pending || preview.rows.length === 0} onClick={confirm}>
          {pending
            ? "Importando…"
            : preview.rows.length > 0
              ? `Importar ${preview.rows.length} ${preview.rows.length === 1 ? "palabra" : "palabras"}`
              : "Importar"}
        </button>
        <Link href={`/mazos/${deckId}`} className="btn btn-quiet">
          Cancelar
        </Link>
      </div>
    </div>
  );
}
