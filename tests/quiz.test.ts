import { describe, expect, it } from "vitest";
import { buildItem, canBuildItem, pickDistractors, type QuizCard } from "@/lib/quiz";

const card = (id: number, over: Partial<QuizCard> = {}): QuizCard => ({
  id,
  deckId: 1,
  term: `term${id}`,
  meaning: `meaning number ${id}`,
  example: "",
  kind: "word",
  stage: 0,
  lang: "en-US",
  ...over,
});

const pool = [1, 2, 3, 4, 5, 6].map((i) => card(i));

describe("pickDistractors", () => {
  it("devuelve 3 sin repetir el objetivo ni textos iguales", () => {
    const withDup = [...pool, card(7, { meaning: pool[0].meaning })];
    const out = pickDistractors(pool[0], withDup, "meaning");
    expect(out).toHaveLength(3);
    expect(out.map((c) => c.id)).not.toContain(1);
    expect(out.map((c) => c.id)).not.toContain(7);
    expect(new Set(out.map((c) => c.meaning)).size).toBe(3);
  });

  it("prefiere el mismo mazo y el mismo tipo", () => {
    const mixed = [
      card(1),
      card(2, { deckId: 2 }),
      card(3, { kind: "collocation" }),
      card(4),
      card(5),
      card(6),
    ];
    const ids = pickDistractors(mixed[0], mixed, "meaning").map((c) => c.id);
    expect(ids.sort()).toEqual([4, 5, 6]);
  });

  it("completa con otros mazos si hace falta", () => {
    const small = [card(1), card(2), card(3, { deckId: 2 }), card(4, { deckId: 2 })];
    expect(pickDistractors(small[0], small, "meaning")).toHaveLength(3);
  });

  it("no mezcla idiomas ni respuestas equivalentes", () => {
    const mixed = [card(1), card(2, { lang: "fr-FR" }), card(3, { meaning: "MEANING NUMBER 1" }), card(4)];
    expect(pickDistractors(mixed[0], mixed, "meaning").map((c) => c.id)).toEqual([4]);
  });
});

describe("buildItem", () => {
  it("arma una pregunta de opción múltiple con 4 opciones y la correcta incluida", () => {
    const item = buildItem(pool[0], pool, "choice");
    expect(item.mode).toBe("choice");
    expect(item.options).toHaveLength(4);
    expect(item.options?.some((o) => o.id === item.correctOptionId && o.text === pool[0].meaning)).toBe(true);
    expect(item.prompt).toBe("term1");
  });

  it("invierte la pregunta en modo reverse", () => {
    const item = buildItem(pool[0], pool, "reverse");
    expect(item.prompt).toBe(pool[0].meaning);
    expect(item.answer).toBe("term1");
  });

  it("usa tres opciones si el mazo es pequeño", () => {
    const item = buildItem(pool[0], pool.slice(0, 3), "choice");
    expect(item.mode).toBe("choice");
    expect(item.options).toHaveLength(3);
  });

  it("cloze sin término en el ejemplo cae a escribir", () => {
    const c = card(1, { example: "nothing here" });
    expect(buildItem(c, pool, "cloze").mode).toBe("typed");
  });

  it("cloze con ejemplo válido tapa el término", () => {
    const c = card(1, { term: "give up", example: "Never give up." });
    const item = buildItem(c, pool, "cloze");
    expect(item.mode).toBe("cloze");
    expect(item.prompt).toBe("Never _____.");
  });

  it("detecta cartas incompatibles con completar y elegir", () => {
    const c = card(1, { example: "No term here" });
    expect(canBuildItem(c, [c], "cloze")).toBe(false);
    expect(canBuildItem(c, [c], "choice")).toBe(false);
    expect(canBuildItem(c, [c], "typed")).toBe(true);
  });

  it("mixto sube la dificultad con la etapa", () => {
    expect(buildItem(card(1, { stage: 0 }), pool, "mixed").mode).toBe("choice");
    expect(buildItem(card(1, { stage: 2 }), pool, "mixed").mode).toBe("reverse");
    expect(["typed", "cloze"]).toContain(buildItem(card(1, { stage: 4 }), pool, "mixed").mode);
  });
});
