import Papa from "papaparse";
import { guessKind, migrateLegacyKind, type CardKind } from "./quiz";

export type ImportRow = {
  term: string;
  meaning: string;
  example: string;
  notes: string;
  kind: CardKind;
};

export type ImportPreview = {
  rows: ImportRow[];
  invalid: { line: number; raw: string; reason: string }[];
  duplicates: ImportRow[];
};

const SEPARATORS = ["\t", ";", " = ", " - ", " – ", " — ", ","] as const;

/** Elige el separador que aparece en más líneas. */
export function detectSeparator(lines: string[]): string {
  let best: string = ",";
  let bestCount = 0;
  for (const sep of SEPARATORS) {
    const count = lines.filter((l) => l.includes(sep)).length;
    if (count > bestCount) {
      best = sep;
      bestCount = count;
    }
  }
  return best;
}

function toKind(value: string | undefined, term: string): CardKind {
  const v = (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return migrateLegacyKind(v) ?? guessKind(term);
}

/** Separador propio de una línea, para cuando no usa el del resto de la lista. */
function detectLineSeparator(line: string): string | null {
  return SEPARATORS.find((sep) => line.includes(sep)) ?? null;
}

const HEADER_TERMS = new Set(["term", "word", "palabra", "termino", "término"]);

/**
 * Convierte texto pegado (o el contenido de un CSV) en filas.
 * Columnas: término, significado, ejemplo, notas, tipo (opcionales las últimas tres).
 */
export function parseImport(text: string, existingTerms: Iterable<string> = []): ImportPreview {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  const preview: ImportPreview = { rows: [], invalid: [], duplicates: [] };
  if (lines.length === 0) return preview;

  const separator = detectSeparator(lines);
  const known = new Set([...existingTerms].map((t) => t.trim().toLowerCase()));
  const seen = new Set<string>();

  lines.forEach((raw, index) => {
    // Se usa el separador de la lista; si esta línea no lo tiene, el que tenga ella.
    const sep = raw.includes(separator) ? separator : (detectLineSeparator(raw) ?? separator);
    let cells: string[];
    if (sep === "," || sep === ";" || sep === "\t") {
      const parsed = Papa.parse<string[]>(raw, { delimiter: sep });
      cells = (parsed.data[0] ?? []).map((c) => c.trim());
    } else {
      cells = raw.split(sep).map((c) => c.trim());
    }

    const [term = "", meaning = "", example = "", notes = "", kind] = cells;
    if (index === 0 && HEADER_TERMS.has(term.toLowerCase())) return;

    if (!term || !meaning) {
      preview.invalid.push({
        line: index + 1,
        raw,
        reason: !term ? "Falta la palabra" : "Falta el significado",
      });
      return;
    }

    const row: ImportRow = { term, meaning, example, notes, kind: toKind(kind, term) };
    const key = term.toLowerCase();
    if (known.has(key) || seen.has(key)) {
      preview.duplicates.push(row);
      return;
    }
    seen.add(key);
    preview.rows.push(row);
  });

  return preview;
}
