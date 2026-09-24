import { beforeAll, describe, expect, it } from "vitest";

process.env.WORDGROW_DB = ":memory:";

const { createDeck, listDecks, deleteDeck } = await import("@/lib/db/queries/decks");
const { createCard, importCards, listCards, updateCard, existingTerms, seedSampleCardStages } = await import("@/lib/db/queries/cards");
const { buildSession, recordReview, countSources } = await import("@/lib/db/queries/study");
const { statsData, todaySummary } = await import("@/lib/db/queries/stats");
const { exportAll, importAll, resetAll } = await import("@/lib/db/queries/backup");
const { getSettings, saveSettings } = await import("@/lib/db/queries/settings");
const { createUser } = await import("@/lib/db/queries/auth");
const { hashPassword } = await import("@/lib/auth/password");
const { SAMPLE_CARDS, SAMPLE_DECK } = await import("@/lib/sample-deck");

const card = (term: string, meaning = `def ${term}`) => ({
  term,
  meaning,
  example: "",
  notes: "",
  kind: "word" as const,
});

let userId: number;
let deckId: number;

beforeAll(() => {
  userId = createUser({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    passwordHash: hashPassword("correcthorse1"),
  });
  deckId = createDeck(userId, SAMPLE_DECK);
  importCards(userId, deckId, SAMPLE_CARDS);
});

describe("mazos y tarjetas", () => {
  it("importa el mazo de ejemplo con progreso en etapa 0", () => {
    const [deck] = listDecks(userId);
    expect(deck.total).toBe(SAMPLE_CARDS.length);
    expect(deck.due).toBe(SAMPLE_CARDS.length);
    expect(deck.stages[0]).toBe(SAMPLE_CARDS.length);
  });

  it("no duplica términos del mismo mazo", () => {
    expect(createCard(userId, deckId, card("give up"))).toBe(false);
    expect(importCards(userId, deckId, [card("give up"), card("brand new")])).toEqual({ added: 1, skipped: 1 });
    expect(existingTerms(userId, deckId)).toContain("brand new");
  });

  it("busca y filtra", () => {
    expect(listCards(userId, deckId, { q: "piece" }).map((c) => c.term)).toEqual(["piece of cake"]);
    expect(listCards(userId, deckId, { kind: "collocation" }).length).toBe(8);
    expect(listCards(userId, deckId, { q: "100%" })).toEqual([]);
  });

  it("avisa cuando editar choca con otra tarjeta", () => {
    const [a] = listCards(userId, deckId, { q: "look after" });
    expect(updateCard(userId, a.id, card("give up"))).toBe(false);
    expect(updateCard(userId, a.id, card("look after", "cuidar"))).toBe(true);
  });
});

describe("rangos del mazo de ejemplo", () => {
  it("muestra los cinco rangos y conserva las cartas ya repasadas", () => {
    const sampleUserId = createUser({
      firstName: "Ejemplo",
      lastName: "Prueba",
      email: "rangos@example.com",
      passwordHash: hashPassword("correcthorse3"),
    });
    const sampleDeckId = createDeck(sampleUserId, SAMPLE_DECK);
    importCards(sampleUserId, sampleDeckId, SAMPLE_CARDS);
    const [reviewedCard] = listCards(sampleUserId, sampleDeckId);
    recordReview(sampleUserId, { cardId: reviewedCard.id, mode: "choice", result: "wrong", responseMs: 500 });
    const before = listCards(sampleUserId, sampleDeckId).find((card) => card.id === reviewedCard.id);

    expect(seedSampleCardStages(sampleUserId, sampleDeckId)).toBeGreaterThan(0);
    const cards = listCards(sampleUserId, sampleDeckId);
    expect(new Set(cards.map((card) => card.stage))).toEqual(new Set([0, 1, 2, 3, 4]));
    expect(cards.find((card) => card.id === reviewedCard.id)).toEqual(before);
    expect(seedSampleCardStages(sampleUserId, sampleDeckId)).toBe(0);
    expect(seedSampleCardStages(userId, sampleDeckId)).toBe(0);
  });
});

describe("sesión de estudio y repasos", () => {
  it("arma una sesión mixta con opciones válidas", () => {
    const items = buildSession(userId, { deckIds: [], source: "due", mode: "mixed", limit: 10 });
    expect(items).toHaveLength(10);
    for (const it of items) {
      expect(it.mode).toBe("choice");
      expect(it.options).toHaveLength(4);
      expect(it.options!.filter((o) => o.id === it.correctOptionId)).toHaveLength(1);
    }
  });

  it("acertar sube la etapa y saca la tarjeta de las pendientes", () => {
    const before = countSources(userId, [deckId]).due;
    const [item] = buildSession(userId, { deckIds: [deckId], source: "due", mode: "choice", limit: 1 });
    const res = recordReview(userId, { cardId: item.cardId, mode: "choice", result: "correct", responseMs: 900 });
    expect(res?.stage).toBe(1);
    expect(countSources(userId, [deckId]).due).toBe(before - 1);
  });

  it("fallar baja la etapa y la marca como difícil", () => {
    const [item] = buildSession(userId, { deckIds: [deckId], source: "new", mode: "choice", limit: 1 });
    recordReview(userId, { cardId: item.cardId, mode: "choice", result: "wrong", responseMs: 500 });
    const hard = buildSession(userId, { deckIds: [deckId], source: "hard", mode: "choice", limit: 5 });
    expect(hard.map((h) => h.cardId)).toContain(item.cardId);
  });

  it("con varios mazos, sólo trae cartas de esos mazos", () => {
    // Usuario aparte para no contaminar los conteos que usan los tests de más abajo.
    const otherUserId = createUser({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "margaret@example.com",
      passwordHash: hashPassword("correcthorse1"),
    });
    const deckA = createDeck(otherUserId, SAMPLE_DECK);
    const deckB = createDeck(otherUserId, { ...SAMPLE_DECK, name: "Otro mazo" });
    importCards(otherUserId, deckA, SAMPLE_CARDS);
    importCards(otherUserId, deckB, SAMPLE_CARDS.slice(0, 2));

    const onlyA = countSources(otherUserId, [deckA]).all;
    const onlyB = countSources(otherUserId, [deckB]).all;
    const items = buildSession(otherUserId, { deckIds: [deckA, deckB], source: "all", mode: "mixed", limit: 100 });
    expect(items.length).toBe(onlyA + onlyB);
    expect(items.length).toBeGreaterThan(onlyA);
  });

  it("devuelve null para tarjetas que no existen", () => {
    expect(recordReview(userId, { cardId: 99999, mode: "typed", result: "correct", responseMs: 1 })).toBeNull();
  });
});

describe("estadísticas", () => {
  it("resume el día, la racha y la precisión", () => {
    const today = todaySummary(userId);
    expect(today.reviewedToday).toBe(2);
    expect(today.streak).toBe(1);
    const stats = statsData(userId);
    expect(stats.totalReviews).toBe(2);
    expect(stats.accuracy).toBe(0.5);
    expect(stats.heatmap).toHaveLength(84);
    expect(stats.heatmap.at(-1)?.count).toBe(2);
    expect(stats.hard).toHaveLength(1);
  });
});

describe("ajustes y backup", () => {
  it("guarda y lee ajustes", () => {
    expect(getSettings(userId).dailyGoal).toBe(20);
    saveSettings(userId, { dailyGoal: 35, ttsRate: 0.8, autoplayAudio: true, theme: "dark", ttsVoice: "Google US English" });
    expect(getSettings(userId)).toEqual({
      dailyGoal: 35,
      ttsRate: 0.8,
      autoplayAudio: true,
      theme: "dark",
      ttsVoice: "Google US English",
    });
  });

  it("exporta e importa sin perder nada", () => {
    const backup = JSON.parse(JSON.stringify(exportAll(userId)));
    resetAll(userId);
    expect(listDecks(userId)).toHaveLength(0);
    const res = importAll(userId, backup);
    expect(res.decks).toBe(1);
    expect(listDecks(userId)[0].total).toBe(backup.cards.length);
    expect(statsData(userId).totalReviews).toBe(2);
    expect(getSettings(userId).theme).toBe("dark");
  });

  it("rechaza archivos que no son un backup y no toca los datos", () => {
    expect(() => importAll(userId, { hola: 1 })).toThrow(/no es un backup/);
    const bad = JSON.parse(JSON.stringify(exportAll(userId)));
    bad.decks[0].evil = "1; DROP TABLE decks";
    expect(() => importAll(userId, bad)).toThrow(/Columna desconocida/);
    expect(listDecks(userId)).toHaveLength(1);
  });

  it("borrar un mazo borra sus tarjetas y repasos", () => {
    deleteDeck(userId, listDecks(userId)[0].id);
    expect(statsData(userId).totalReviews).toBe(0);
    expect(todaySummary(userId).totalCards).toBe(0);
  });
});

describe("aislamiento entre usuarios", () => {
  it("un usuario no ve ni puede tocar los mazos de otro", () => {
    const otherId = createUser({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      passwordHash: hashPassword("correcthorse2"),
    });
    const myDeck = createDeck(userId, { name: "Mío", description: "", color: "leaf", lang: "en-US" });
    expect(listDecks(otherId)).toHaveLength(0);
    expect(listCards(otherId, myDeck)).toHaveLength(0);
    expect(createCard(otherId, myDeck, card("intruso"))).toBe(false);

    deleteDeck(otherId, myDeck);
    expect(listDecks(userId).some((d) => d.id === myDeck)).toBe(true);
  });
});
