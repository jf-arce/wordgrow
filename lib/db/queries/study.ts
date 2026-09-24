import "server-only";
import { getDb, transaction } from "../index";
import { buildItem, canBuildItem, type CardKind, type QuizCard, type QuizItem, type StudyMode } from "@/lib/quiz";
import { shuffle } from "@/lib/text";
import { nextProgress, type Result } from "@/lib/srs";
import type { QuizMode } from "@/lib/quiz";
import { SOURCE_LABELS, type StudySource } from "@/lib/study";
import { userOwnsCard } from "./decks";

export { SOURCE_LABELS, type StudySource };

type Row = {
  id: number;
  deckId: number;
  term: string;
  meaning: string;
  example: string;
  kind: CardKind;
  stage: number;
  lang: string;
  dueAt: number;
  lapses: number;
  reps: number;
};

const SELECT = `
  SELECT c.id, c.deck_id AS deckId, c.term, c.meaning, c.example, c.kind,
         p.stage, d.lang, p.due_at AS dueAt, p.lapses, p.reps
  FROM cards c
  JOIN card_progress p ON p.card_id = c.id
  JOIN decks d ON d.id = c.deck_id
  WHERE d.user_id = ?`;

function toQuizCard(r: Row): QuizCard {
  return {
    id: r.id,
    deckId: r.deckId,
    term: r.term,
    meaning: r.meaning,
    example: r.example,
    kind: r.kind,
    stage: r.stage,
    lang: r.lang,
  };
}

export type SessionOptions = {
  /** Vacío = todos los mazos. */
  deckIds: number[];
  source: StudySource;
  mode: StudyMode;
  limit: number;
};

/** Cuántas tarjetas hay disponibles para cada fuente (para la pantalla de configuración). */
export function countSources(userId: number, deckIds: number[] = [], now = Date.now()): Record<StudySource, number> {
  const scope = deckIds.length ? `AND c.deck_id IN (${deckIds.map(() => "?").join(",")})` : "";
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(p.due_at <= ?), 0) AS due,
              COALESCE(SUM(p.reps = 0), 0) AS fresh,
              COALESCE(SUM(p.lapses > 0 OR (p.reps > 0 AND p.stage <= 2)), 0) AS hard
       FROM cards c JOIN card_progress p ON p.card_id = c.id JOIN decks d ON d.id = c.deck_id
       WHERE d.user_id = ? ${scope}`,
    )
    .get(now, userId, ...deckIds) as { total: number; due: number; fresh: number; hard: number };
  return { due: row.due, all: row.total, hard: row.hard, new: row.fresh };
}

/** Igual que `countSources`, pero desglosado por mazo: para que el selector de mazos
 * muestre conteos por fuente sin un round-trip al servidor por cada click. */
export function countSourcesByDeck(userId: number, now = Date.now()): Record<number, Record<StudySource, number>> {
  const rows = getDb()
    .prepare(
      `SELECT c.deck_id AS deckId, p.due_at AS dueAt, p.reps, p.lapses, p.stage
       FROM cards c JOIN card_progress p ON p.card_id = c.id JOIN decks d ON d.id = c.deck_id
       WHERE d.user_id = ?`,
    )
    .all(userId) as { deckId: number; dueAt: number; reps: number; lapses: number; stage: number }[];

  const out: Record<number, Record<StudySource, number>> = {};
  for (const r of rows) {
    const c = (out[r.deckId] ??= { due: 0, all: 0, hard: 0, new: 0 });
    c.all += 1;
    if (r.dueAt <= now) c.due += 1;
    if (r.reps === 0) c.new += 1;
    if (r.lapses > 0 || (r.reps > 0 && r.stage <= 2)) c.hard += 1;
  }
  return out;
}

export function buildSession(userId: number, options: SessionOptions, now = Date.now()): QuizItem[] {
  const db = getDb();
  const all = db.prepare(SELECT).all(userId) as Row[];
  const scoped = options.deckIds.length ? all.filter((r) => options.deckIds.includes(r.deckId)) : all;

  let picked: Row[];
  switch (options.source) {
    case "due":
      picked = scoped.filter((r) => r.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
      break;
    case "new":
      picked = shuffle(scoped.filter((r) => r.reps === 0));
      break;
    case "hard":
      picked = scoped
        .filter((r) => r.lapses > 0 || (r.reps > 0 && r.stage <= 2))
        .sort((a, b) => b.lapses - a.lapses || a.stage - b.stage);
      break;
    default:
      picked = shuffle(scoped);
  }

  const pool = scoped.map(toQuizCard);
  const compatible = options.mode === "mixed" ? picked : picked.filter((r) => canBuildItem(toQuizCard(r), pool, options.mode));
  return shuffle(compatible.slice(0, options.limit)).map((r) => buildItem(toQuizCard(r), pool, options.mode));
}

export function recordReview(
  userId: number,
  input: { cardId: number; mode: QuizMode; result: Result; responseMs: number },
): { stage: number; dueAt: number } | null {
  if (!userOwnsCard(userId, input.cardId)) return null;
  const now = Date.now();
  return transaction((db) => {
    const current = db
      .prepare("SELECT stage, reps, lapses FROM card_progress WHERE card_id = ?")
      .get(input.cardId) as { stage: number; reps: number; lapses: number } | undefined;
    if (!current) return null;

    const next = nextProgress(current, input.result, now);
    db.prepare(
      `UPDATE card_progress
       SET stage = ?, due_at = ?, reps = ?, lapses = ?, last_reviewed_at = ?
       WHERE card_id = ?`,
    ).run(next.stage, next.dueAt, next.reps, next.lapses, now, input.cardId);

    db.prepare(
      `INSERT INTO reviews (card_id, mode, correct, grade, response_ms, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(input.cardId, input.mode, input.result === "correct" ? 1 : 0, input.result, input.responseMs, now);

    return { stage: next.stage, dueAt: next.dueAt };
  });
}
