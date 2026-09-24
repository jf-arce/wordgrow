import { describe, expect, it } from "vitest";
import { detectSeparator, parseImport } from "@/lib/import";
import { guessKind } from "@/lib/quiz";
import { computeStreak, dayKey, bestStreak } from "@/lib/streak";

describe("parseImport", () => {
  it("detecta tabulaciones", () => {
    const r = parseImport("give up\trendirse\tNever give up\nlook after\tcuidar");
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({ term: "give up", meaning: "rendirse", example: "Never give up" });
  });

  it("detecta ' - ' como separador", () => {
    const r = parseImport("break the ice - romper el hielo\npiece of cake - muy fácil");
    expect(r.rows.map((x) => x.term)).toEqual(["break the ice", "piece of cake"]);
  });

  it("respeta comas dentro de comillas en CSV", () => {
    const r = parseImport('term,meaning,example\nrun out of,"quedarse sin, agotar","We ran out of milk, sadly"');
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].meaning).toBe("quedarse sin, agotar");
    expect(r.rows[0].example).toBe("We ran out of milk, sadly");
  });

  it("ignora la fila de encabezado", () => {
    const r = parseImport("palabra;significado\nhappy;feliz");
    expect(r.rows).toHaveLength(1);
  });

  it("reporta filas inválidas con su línea", () => {
    const r = parseImport("a - b\nsolo\n - sin palabra");
    expect(r.invalid.map((i) => i.line)).toEqual([2, 3]);
  });

  it("separa duplicados, propios y ya existentes", () => {
    const r = parseImport("cat - gato\nCat - gato\ndog - perro", ["dog"]);
    expect(r.rows.map((x) => x.term)).toEqual(["cat"]);
    expect(r.duplicates.map((x) => x.term)).toEqual(["Cat", "dog"]);
  });

  it("acepta líneas con otro separador que el resto de la lista", () => {
    const r = parseImport("give up - rendirse\nbreak the ice = romper el hielo\nhappy;feliz\nsolo");
    expect(r.rows.map((x) => [x.term, x.meaning])).toEqual([
      ["give up", "rendirse"],
      ["break the ice", "romper el hielo"],
      ["happy", "feliz"],
    ]);
    expect(r.invalid.map((i) => i.line)).toEqual([4]);
  });

  it("adivina el tipo", () => {
    expect(guessKind("happy")).toBe("word");
    expect(guessKind("give up")).toBe("phrasal_verb");
    expect(guessKind("break the ice")).toBe("collocation");
  });

  it("reconoce tipos legacy (idiom/phrase) al importar", () => {
    const r = parseImport("kick the bucket;morir;;;idiom\nas a matter of fact;de hecho;;;phrase");
    expect(r.rows.map((x) => x.kind)).toEqual(["collocation", "collocation"]);
  });

  it("elige el separador más frecuente", () => {
    expect(detectSeparator(["a;b", "c;d"])).toBe(";");
  });
});

describe("streak", () => {
  const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 15).getTime();
  const days = (...keys: [number, number, number][]) => new Set(keys.map((k) => dayKey(at(...k))));

  it("cuenta días seguidos hasta hoy", () => {
    expect(computeStreak(days([2026, 9, 16], [2026, 9, 17], [2026, 9, 18]), at(2026, 9, 18))).toBe(3);
  });
  it("mantiene la racha si hoy todavía no repasaste pero ayer sí", () => {
    expect(computeStreak(days([2026, 9, 16], [2026, 9, 17]), at(2026, 9, 18))).toBe(2);
  });
  it("se corta si pasó un día entero", () => {
    expect(computeStreak(days([2026, 9, 15]), at(2026, 9, 18))).toBe(0);
  });
  it("calcula la mejor racha", () => {
    expect(bestStreak(days([2026, 9, 1], [2026, 9, 2], [2026, 9, 3], [2026, 9, 10], [2026, 9, 11]))).toBe(3);
  });
});
