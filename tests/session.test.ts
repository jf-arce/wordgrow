import { beforeAll, describe, expect, it } from "vitest";

const { createDeck } = await import("@/lib/db/queries/decks");
const { importCards } = await import("@/lib/db/queries/cards");
const { buildSession } = await import("@/lib/db/queries/study");
const { openSession, findActiveSession, saveSessionProgress, finishSession, activeSessionSummary, answerSession, advanceSession, resolveStudyHref } = await import(
  "@/lib/db/queries/session"
);
const { createTestUser } = await import("./helpers/user");
const { SAMPLE_CARDS, SAMPLE_DECK } = await import("@/lib/sample-deck");
const { getStudyPrefs, saveStudyPrefs } = await import("@/lib/db/queries/settings");
const { prisma } = await import("@/lib/db/index");

let userId: string;
let deckId: number;

beforeAll(async () => {
  userId = await createTestUser({
    firstName: "Katherine",
    lastName: "Johnson",
    email: "katherine-session@example.com",
    password: "correcthorse1",
  });
  deckId = await createDeck(userId, SAMPLE_DECK);
  await importCards(userId, deckId, SAMPLE_CARDS);
});

const opts = { deckIds: [] as number[], source: "due" as const, mode: "mixed" as const, limit: 5 };

describe("sesión de estudio persistida", () => {
  it("abre una sesión nueva y se puede retomar tal cual quedó", async () => {
    const items = await buildSession(userId, opts);
    const queue = items.map((i) => ({ ...i, retry: false }));
    const session = await openSession(userId, opts, queue);
    expect(session.position).toBe(0);
    expect(session.firsts).toEqual([]);

    await saveSessionProgress(userId, session.id, {
      queue,
      firsts: [{ item: queue[0], result: "correct", stageAfter: 1 }],
      position: 1,
    });

    const resumed = await findActiveSession(userId, opts);
    expect(resumed?.id).toBe(session.id);
    expect(resumed?.position).toBe(1);
    expect(resumed?.firsts).toHaveLength(1);
    expect(resumed?.queue).toHaveLength(queue.length);
  });

  it("una sesión distinta (otro source) no la encuentra", async () => {
    expect(await findActiveSession(userId, { ...opts, source: "all" })).toBeNull();
  });

  it("al terminar, deja de aparecer como activa", async () => {
    const session = await findActiveSession(userId, opts);
    expect(session).not.toBeNull();
    await finishSession(userId, session!.id);
    expect(await findActiveSession(userId, opts)).toBeNull();
    expect(await activeSessionSummary(userId)).toBeNull();
  });

  it("activeSessionSummary refleja cuánto se respondió", async () => {
    const items = await buildSession(userId, { deckIds: [], source: "all", mode: "mixed", limit: 3 });
    const queue = items.map((i) => ({ ...i, retry: false }));
    const session = await openSession(userId, { deckIds: [], source: "all", mode: "mixed", limit: 3 }, queue);
    await saveSessionProgress(userId, session.id, {
      queue,
      firsts: [{ item: queue[0], result: "correct", stageAfter: 1 }],
      position: 1,
    });
    const summary = await activeSessionSummary(userId);
    expect(summary?.answered).toBe(1);
    expect(summary?.limit).toBe(3);
  });

  it("una sesión con dos mazos se retoma sólo con esa misma combinación", async () => {
    const deckId2 = await createDeck(userId, { ...SAMPLE_DECK, name: "Otro mazo" });
    await importCards(userId, deckId2, SAMPLE_CARDS.slice(0, 2));
    const multiOpts = { deckIds: [deckId2, deckId], source: "all" as const, mode: "mixed" as const, limit: 3 };
    const items = await buildSession(userId, multiOpts);
    const queue = items.map((i) => ({ ...i, retry: false }));
    const session = await openSession(userId, multiOpts, queue);

    // El orden de deckIds no importa: se normaliza antes de comparar/guardar.
    expect((await findActiveSession(userId, { ...multiOpts, deckIds: [deckId, deckId2] }))?.id).toBe(session.id);
    expect(await findActiveSession(userId, { ...multiOpts, deckIds: [deckId] })).toBeNull();
    await finishSession(userId, session.id);
  });
});

describe("preferencias de estudio: mazos", () => {
  it("guarda y relee una lista de mazos", async () => {
    await saveStudyPrefs(userId, { source: "due", mode: "typed", limit: 15, deckScope: "selected", deckIds: [deckId] });
    expect((await getStudyPrefs(userId)).deckIds).toEqual([deckId]);
  });
});

describe("respuestas de sesión", () => {
  it("guarda una sola vez, restaura la respuesta y avanza", async () => {
    const options = { deckIds: [deckId], source: "all" as const, mode: "flashcard" as const, limit: 1 };
    const item = (await buildSession(userId, options))[0];
    const session = await openSession(userId, options, [{ ...item, retry: false }]);
    const before = await prisma.review.count({ where: { cardId: item.cardId } });
    const first = await answerSession(userId, session.id, 0, { grade: "correct", responseMs: 500 });
    const second = await answerSession(userId, session.id, 0, { grade: "wrong", responseMs: 500 });
    expect(second).toEqual(first);
    expect((await findActiveSession(userId, options))?.currentAnswer).toEqual(first?.answer);
    expect(await prisma.review.count({ where: { cardId: item.cardId } })).toBe(before + 1);
    expect(await advanceSession(userId, session.id, 0)).toEqual({ position: 1, finished: true });
    expect(await advanceSession(userId, session.id, 0)).toBeNull();
  });
});

describe("acceso principal a estudiar", () => {
  it("usa la configuración guardada aunque exista otra sesión pendiente", async () => {
    const id = await createTestUser({ firstName: "Main", lastName: "Nav", email: "main-nav-session@example.com", password: "correcthorse1" });
    const deck = await createDeck(id, { ...SAMPLE_DECK, name: "Selected" });
    await importCards(id, deck, SAMPLE_CARDS.slice(0, 2));
    await saveStudyPrefs(id, { deckScope: "selected", deckIds: [deck], source: "all", mode: "typed", limit: 10 });
    const other = { deckIds: [] as number[], source: "due" as const, mode: "mixed" as const, limit: 2 };
    await openSession(id, other, []);
    expect(await resolveStudyHref(id)).toContain("mode=typed");
    expect(await resolveStudyHref(id)).toContain(`decks=${deck}`);
  });
});
