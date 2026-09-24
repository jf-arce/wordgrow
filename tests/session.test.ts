import { beforeAll, describe, expect, it } from "vitest";

process.env.WORDGROW_DB = ":memory:";

const { createDeck } = await import("@/lib/db/queries/decks");
const { importCards } = await import("@/lib/db/queries/cards");
const { buildSession } = await import("@/lib/db/queries/study");
const { openSession, findActiveSession, saveSessionProgress, finishSession, activeSessionSummary, answerSession, advanceSession, resolveStudyHref } = await import(
  "@/lib/db/queries/session"
);
const { createUser } = await import("@/lib/db/queries/auth");
const { hashPassword } = await import("@/lib/auth/password");
const { SAMPLE_CARDS, SAMPLE_DECK } = await import("@/lib/sample-deck");
const { getStudyPrefs, saveStudyPrefs } = await import("@/lib/db/queries/settings");
const { getDb } = await import("@/lib/db/index");

let userId: number;
let deckId: number;

beforeAll(() => {
  userId = createUser({
    firstName: "Katherine",
    lastName: "Johnson",
    email: "katherine@example.com",
    passwordHash: hashPassword("correcthorse1"),
  });
  deckId = createDeck(userId, SAMPLE_DECK);
  importCards(userId, deckId, SAMPLE_CARDS);
});

const opts = { deckIds: [] as number[], source: "due" as const, mode: "mixed" as const, limit: 5 };

describe("sesión de estudio persistida", () => {
  it("abre una sesión nueva y se puede retomar tal cual quedó", () => {
    const items = buildSession(userId, opts);
    const queue = items.map((i) => ({ ...i, retry: false }));
    const session = openSession(userId, opts, queue);
    expect(session.position).toBe(0);
    expect(session.firsts).toEqual([]);

    saveSessionProgress(userId, session.id, {
      queue,
      firsts: [{ item: items[0], result: "correct", stageAfter: 1 }],
      position: 1,
    });

    const resumed = findActiveSession(userId, opts);
    expect(resumed?.id).toBe(session.id);
    expect(resumed?.position).toBe(1);
    expect(resumed?.firsts).toHaveLength(1);
    expect(resumed?.queue).toHaveLength(queue.length);
  });

  it("una sesión distinta (otro source) no la encuentra", () => {
    expect(findActiveSession(userId, { ...opts, source: "all" })).toBeNull();
  });

  it("al terminar, deja de aparecer como activa", () => {
    const session = findActiveSession(userId, opts);
    expect(session).not.toBeNull();
    finishSession(userId, session!.id);
    expect(findActiveSession(userId, opts)).toBeNull();
    expect(activeSessionSummary(userId)).toBeNull();
  });

  it("activeSessionSummary refleja cuánto se respondió", () => {
    const items = buildSession(userId, { deckIds: [], source: "all", mode: "mixed", limit: 3 });
    const queue = items.map((i) => ({ ...i, retry: false }));
    const session = openSession(userId, { deckIds: [], source: "all", mode: "mixed", limit: 3 }, queue);
    saveSessionProgress(userId, session.id, {
      queue,
      firsts: [{ item: items[0], result: "correct", stageAfter: 1 }],
      position: 1,
    });
    const summary = activeSessionSummary(userId);
    expect(summary?.answered).toBe(1);
    expect(summary?.limit).toBe(3);
  });

  it("una sesión con dos mazos se retoma sólo con esa misma combinación", () => {
    const deckId2 = createDeck(userId, { ...SAMPLE_DECK, name: "Otro mazo" });
    importCards(userId, deckId2, SAMPLE_CARDS.slice(0, 2));
    const multiOpts = { deckIds: [deckId2, deckId], source: "all" as const, mode: "mixed" as const, limit: 3 };
    const items = buildSession(userId, multiOpts);
    const queue = items.map((i) => ({ ...i, retry: false }));
    const session = openSession(userId, multiOpts, queue);

    // El orden de deckIds no importa: se normaliza antes de comparar/guardar.
    expect(findActiveSession(userId, { ...multiOpts, deckIds: [deckId, deckId2] })?.id).toBe(session.id);
    expect(findActiveSession(userId, { ...multiOpts, deckIds: [deckId] })).toBeNull();
    finishSession(userId, session.id);
  });
});

describe("preferencias de estudio: mazos", () => {
  it("guarda y relee una lista de mazos", () => {
    saveStudyPrefs(userId, { source: "due", mode: "typed", limit: 15, deckScope: "selected", deckIds: [deckId] });
    expect(getStudyPrefs(userId).deckIds).toEqual([deckId]);
  });

  it("una preferencia vieja (study_deck, un solo mazo) se sigue leyendo si no hay study_decks", () => {
    const otherUserId = createUser({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      passwordHash: hashPassword("correcthorse1"),
    });
    getDb()
      .prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'study_deck', ?)")
      .run(otherUserId, String(deckId));
    expect(getStudyPrefs(otherUserId).deckIds).toEqual([deckId]);
  });
});

describe("respuestas de sesión", () => {
  it("guarda una sola vez, restaura la respuesta y avanza", () => {
    const options = { deckIds: [deckId], source: "all" as const, mode: "flashcard" as const, limit: 1 };
    const item = buildSession(userId, options)[0];
    const session = openSession(userId, options, [{ ...item, retry: false }]);
    const before = (getDb().prepare("SELECT COUNT(*) AS n FROM reviews WHERE card_id = ?").get(item.cardId) as { n: number }).n;
    const first = answerSession(userId, session.id, 0, { grade: "correct", responseMs: 500 });
    const second = answerSession(userId, session.id, 0, { grade: "wrong", responseMs: 500 });
    expect(second).toEqual(first);
    expect(findActiveSession(userId, options)?.currentAnswer).toEqual(first?.answer);
    expect((getDb().prepare("SELECT COUNT(*) AS n FROM reviews WHERE card_id = ?").get(item.cardId) as { n: number }).n).toBe(before + 1);
    expect(advanceSession(userId, session.id, 0)).toEqual({ position: 1, finished: true });
    expect(advanceSession(userId, session.id, 0)).toBeNull();
  });
});

describe("acceso principal a estudiar", () => {
  it("usa la configuración guardada aunque exista otra sesión pendiente", () => {
    const id = createUser({ firstName: "Main", lastName: "Nav", email: "main-nav@example.com", passwordHash: hashPassword("correcthorse1") });
    const deck = createDeck(id, { ...SAMPLE_DECK, name: "Selected" });
    importCards(id, deck, SAMPLE_CARDS.slice(0, 2));
    saveStudyPrefs(id, { deckScope: "selected", deckIds: [deck], source: "all", mode: "typed", limit: 10 });
    const other = { deckIds: [], source: "due" as const, mode: "mixed" as const, limit: 2 };
    openSession(id, other, []);
    expect(resolveStudyHref(id)).toContain("mode=typed");
    expect(resolveStudyHref(id)).toContain(`decks=${deck}`);
  });
});
