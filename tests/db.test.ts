import { beforeAll, describe, expect, it } from "vitest";

const { createDeck, listDecks, deleteDeck } = await import("@/lib/db/queries/decks");
const { createCard, importCards, listCards, updateCard, existingTerms, seedSampleCardStages } = await import("@/lib/db/queries/cards");
const { buildSession, recordReview, countSources } = await import("@/lib/db/queries/study");
const { statsData, todaySummary } = await import("@/lib/db/queries/stats");
const { exportAll, importAll, resetAll } = await import("@/lib/db/queries/backup");
const { getSettings, saveSettings } = await import("@/lib/db/queries/settings");
const { createTestUser } = await import("./helpers/user");
const { SAMPLE_CARDS, SAMPLE_DECK } = await import("@/lib/sample-deck");

const card = (term: string, meaning = `def ${term}`) => ({
  term,
  meaning,
  example: "",
  notes: "",
  kind: "word" as const,
});

let userId: string;
let deckId: number;

beforeAll(async () => {
  userId = await createTestUser({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada-db@example.com",
    password: "correcthorse1",
  });
  deckId = await createDeck(userId, SAMPLE_DECK);
  await importCards(userId, deckId, SAMPLE_CARDS);
});

describe("mazos y tarjetas", () => {
  it("importa el mazo de ejemplo con progreso en etapa 0", async () => {
    const [deck] = await listDecks(userId);
    expect(deck.total).toBe(SAMPLE_CARDS.length);
    expect(deck.due).toBe(SAMPLE_CARDS.length);
    expect(deck.stages[0]).toBe(SAMPLE_CARDS.length);
  });

  it("no duplica términos del mismo mazo", async () => {
    expect(await createCard(userId, deckId, card("give up"))).toBe(false);
    expect(await importCards(userId, deckId, [card("give up"), card("brand new")])).toEqual({ added: 1, skipped: 1 });
    expect(await existingTerms(userId, deckId)).toContain("brand new");
  });

  it("busca y filtra", async () => {
    expect((await listCards(userId, deckId, { q: "piece" })).map((c) => c.term)).toEqual(["piece of cake"]);
    expect((await listCards(userId, deckId, { kind: "collocation" })).length).toBe(8);
    expect(await listCards(userId, deckId, { q: "100%" })).toEqual([]);
  });

  it("avisa cuando editar choca con otra tarjeta", async () => {
    const [a] = await listCards(userId, deckId, { q: "look after" });
    expect(await updateCard(userId, a.id, card("give up"))).toBe(false);
    expect(await updateCard(userId, a.id, card("look after", "cuidar"))).toBe(true);
  });
});

describe("rangos del mazo de ejemplo", () => {
  it("muestra los cinco rangos y conserva las cartas ya repasadas", async () => {
    const sampleUserId = await createTestUser({
      firstName: "Ejemplo",
      lastName: "Prueba",
      email: "rangos-db@example.com",
      password: "correcthorse3",
    });
    const sampleDeckId = await createDeck(sampleUserId, SAMPLE_DECK);
    await importCards(sampleUserId, sampleDeckId, SAMPLE_CARDS);
    const [reviewedCard] = await listCards(sampleUserId, sampleDeckId);
    await recordReview(sampleUserId, { cardId: reviewedCard.id, mode: "choice", result: "wrong", responseMs: 500 });
    const before = (await listCards(sampleUserId, sampleDeckId)).find((c) => c.id === reviewedCard.id);

    expect(await seedSampleCardStages(sampleUserId, sampleDeckId)).toBeGreaterThan(0);
    const cards = await listCards(sampleUserId, sampleDeckId);
    expect(new Set(cards.map((c) => c.stage))).toEqual(new Set([0, 1, 2, 3, 4]));
    expect(cards.find((c) => c.id === reviewedCard.id)).toEqual(before);
    expect(await seedSampleCardStages(sampleUserId, sampleDeckId)).toBe(0);
    expect(await seedSampleCardStages(userId, sampleDeckId)).toBe(0);
    // Este test hace ~25 inserts + ~25 updates uno por uno contra el branch de test de
    // Neon: el testTimeout global (20s) no siempre alcanza sumado a crear el usuario.
  }, 45_000);
});

describe("sesión de estudio y repasos", () => {
  it("arma una sesión mixta con opciones válidas", async () => {
    const items = await buildSession(userId, { deckIds: [], source: "due", mode: "mixed", limit: 10 });
    expect(items).toHaveLength(10);
    for (const it of items) {
      expect(it.mode).toBe("choice");
      expect(it.options).toHaveLength(4);
      expect(it.options!.filter((o) => o.id === it.correctOptionId)).toHaveLength(1);
    }
  });

  it("acertar sube la etapa y saca la tarjeta de las pendientes", async () => {
    const before = (await countSources(userId, [deckId])).due;
    const [item] = await buildSession(userId, { deckIds: [deckId], source: "due", mode: "choice", limit: 1 });
    const res = await recordReview(userId, { cardId: item.cardId, mode: "choice", result: "correct", responseMs: 900 });
    expect(res?.stage).toBe(1);
    expect((await countSources(userId, [deckId])).due).toBe(before - 1);
  });

  it("fallar baja la etapa y la marca como difícil", async () => {
    const [item] = await buildSession(userId, { deckIds: [deckId], source: "new", mode: "choice", limit: 1 });
    await recordReview(userId, { cardId: item.cardId, mode: "choice", result: "wrong", responseMs: 500 });
    const hard = await buildSession(userId, { deckIds: [deckId], source: "hard", mode: "choice", limit: 5 });
    expect(hard.map((h) => h.cardId)).toContain(item.cardId);
  });

  it("con varios mazos, sólo trae cartas de esos mazos", async () => {
    // Usuario aparte para no contaminar los conteos que usan los tests de más abajo.
    const otherUserId = await createTestUser({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "margaret-db@example.com",
      password: "correcthorse1",
    });
    const deckA = await createDeck(otherUserId, SAMPLE_DECK);
    const deckB = await createDeck(otherUserId, { ...SAMPLE_DECK, name: "Otro mazo" });
    await importCards(otherUserId, deckA, SAMPLE_CARDS);
    await importCards(otherUserId, deckB, SAMPLE_CARDS.slice(0, 2));

    const onlyA = (await countSources(otherUserId, [deckA])).all;
    const onlyB = (await countSources(otherUserId, [deckB])).all;
    const items = await buildSession(otherUserId, { deckIds: [deckA, deckB], source: "all", mode: "mixed", limit: 100 });
    expect(items.length).toBe(onlyA + onlyB);
    expect(items.length).toBeGreaterThan(onlyA);
  });

  it("devuelve null para tarjetas que no existen", async () => {
    expect(await recordReview(userId, { cardId: 99999, mode: "typed", result: "correct", responseMs: 1 })).toBeNull();
  });
});

describe("estadísticas", () => {
  it("resume el día, la racha y la precisión", async () => {
    const today = await todaySummary(userId);
    expect(today.reviewedToday).toBe(2);
    expect(today.streak).toBe(1);
    const stats = await statsData(userId);
    expect(stats.totalReviews).toBe(2);
    expect(stats.accuracy).toBe(0.5);
    expect(stats.heatmap).toHaveLength(84);
    expect(stats.heatmap.at(-1)?.count).toBe(2);
    expect(stats.hard).toHaveLength(1);
  });
});

describe("ajustes y backup", () => {
  it("guarda y lee ajustes", async () => {
    expect((await getSettings(userId)).dailyGoal).toBe(20);
    await saveSettings(userId, { dailyGoal: 35, ttsRate: 0.8, autoplayAudio: true, theme: "dark", ttsVoice: "Google US English" });
    expect(await getSettings(userId)).toEqual({
      dailyGoal: 35,
      ttsRate: 0.8,
      autoplayAudio: true,
      theme: "dark",
      ttsVoice: "Google US English",
    });
  });

  it("exporta e importa sin perder nada", async () => {
    const backup = JSON.parse(JSON.stringify(await exportAll(userId)));
    await resetAll(userId);
    expect(await listDecks(userId)).toHaveLength(0);
    const res = await importAll(userId, backup);
    expect(res.decks).toBe(1);
    expect((await listDecks(userId))[0].total).toBe(backup.decks[0].cards.length);
    expect((await statsData(userId)).totalReviews).toBe(2);
    expect((await getSettings(userId)).theme).toBe("dark");
  });

  it("rechaza archivos que no son un backup y no toca los datos", async () => {
    await expect(importAll(userId, { hola: 1 })).rejects.toThrow(/no es un backup/);
    const bad = JSON.parse(JSON.stringify(await exportAll(userId)));
    bad.decks[0].evil = "1; DROP TABLE decks";
    await expect(importAll(userId, bad)).rejects.toThrow(/no es un backup/);
    expect(await listDecks(userId)).toHaveLength(1);
  });

  it("borrar un mazo borra sus tarjetas y repasos", async () => {
    await deleteDeck(userId, (await listDecks(userId))[0].id);
    expect((await statsData(userId)).totalReviews).toBe(0);
    expect((await todaySummary(userId)).totalCards).toBe(0);
  });
});

describe("aislamiento entre usuarios", () => {
  it("un usuario no ve ni puede tocar los mazos de otro", async () => {
    const otherId = await createTestUser({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace-db@example.com",
      password: "correcthorse2",
    });
    const myDeck = await createDeck(userId, { name: "Mío", description: "", color: "leaf", lang: "en-US" });
    expect(await listDecks(otherId)).toHaveLength(0);
    expect(await listCards(otherId, myDeck)).toHaveLength(0);
    expect(await createCard(otherId, myDeck, card("intruso"))).toBe(false);

    await deleteDeck(otherId, myDeck);
    expect((await listDecks(userId)).some((d) => d.id === myDeck)).toBe(true);
  });
});
