/** Minúsculas, sin tildes, sin puntuación y con espacios colapsados. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distancia de edición (Damerau-Levenshtein restringida): una transposición de letras cuenta como 1. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    rows[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) {
        rows[i][j] = j;
        continue;
      }
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

export type TypedVerdict = "exact" | "close" | "wrong";

/** Compara lo escrito con la respuesta. Tolera un error de tipeo (dos si la respuesta es larga). */
export function checkTyped(typed: string, answer: string): TypedVerdict {
  const a = normalize(typed);
  const b = normalize(answer);
  if (!a) return "wrong";
  if (a === b) return "exact";
  const tolerance = b.length > 8 ? 2 : 1;
  return b.length > 3 && editDistance(a, b) <= tolerance ? "close" : "wrong";
}

/** Fisher-Yates. Devuelve una copia. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Tapa el término dentro del ejemplo. Devuelve null si el ejemplo no lo contiene. */
export function maskTerm(example: string, term: string): string | null {
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return null;
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
  if (!re.test(example)) return null;
  return example.replace(re, "_____");
}
