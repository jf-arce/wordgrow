import "server-only";
import { getDb } from "../index";
import { bestStreak, computeStreak, dayKey } from "@/lib/streak";
import { MAX_STAGE } from "@/lib/srs";
import { CARD_KINDS, type CardKind } from "@/lib/quiz";
import { listDecks } from "./decks";

const DAY_MS = 86_400_000;
const DAY_EXPR = "strftime('%Y-%m-%d', r.reviewed_at / 1000, 'unixepoch', 'localtime')";

/** Repasos del usuario, uniendo hasta la tarjeta y el mazo para poder filtrar por dueño. */
const REVIEWS_OF_USER = `FROM reviews r JOIN cards c ON c.id = r.card_id JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ?`;
const PROGRESS_OF_USER = `FROM card_progress p JOIN cards c ON c.id = p.card_id JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ?`;

export type TodaySummary = {
  reviewedToday: number;
  streak: number;
  dueNow: number;
  totalCards: number;
  /** Cantidad de tarjetas por etapa 0..MAX_STAGE. */
  stages: number[];
};

export function todaySummary(userId: number, now = Date.now()): TodaySummary {
  const db = getDb();
  const days = new Set(
    (db.prepare(`SELECT DISTINCT ${DAY_EXPR} AS day ${REVIEWS_OF_USER}`).all(userId) as { day: string }[]).map(
      (r) => r.day,
    ),
  );
  const today = dayKey(now);
  const reviewedToday = (
    db.prepare(`SELECT COUNT(*) AS n ${REVIEWS_OF_USER} AND ${DAY_EXPR} = ?`).get(userId, today) as { n: number }
  ).n;
  const due = db.prepare(`SELECT COUNT(*) AS n ${PROGRESS_OF_USER} AND p.due_at <= ?`).get(userId, now) as {
    n: number;
  };
  const stageRows = db
    .prepare(`SELECT p.stage AS stage, COUNT(*) AS n ${PROGRESS_OF_USER} GROUP BY p.stage`)
    .all(userId) as { stage: number; n: number }[];
  const stages: number[] = Array(MAX_STAGE + 1).fill(0);
  for (const r of stageRows) stages[r.stage] = r.n;

  return {
    reviewedToday,
    streak: computeStreak(days, now),
    dueNow: due.n,
    totalCards: stages.reduce((a, b) => a + b, 0),
    stages,
  };
}

export type StatsData = {
  totalReviews: number;
  accuracy: number | null;
  streak: number;
  bestStreak: number;
  heatmap: { day: string; count: number }[];
  decks: { id: number; name: string; color: string; reviews: number; accuracy: number | null }[];
  hard: { id: number; term: string; meaning: string; lapses: number; deck: string }[];
  stages: number[];
};

export const HEATMAP_DAYS = 84;

export function statsData(userId: number, now = Date.now()): StatsData {
  const db = getDb();
  const activeDays = new Set(
    (db.prepare(`SELECT DISTINCT ${DAY_EXPR} AS day ${REVIEWS_OF_USER}`).all(userId) as { day: string }[]).map(
      (r) => r.day,
    ),
  );

  const totals = db
    .prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(r.correct), 0) AS ok ${REVIEWS_OF_USER}`)
    .get(userId) as { n: number; ok: number };

  const perDay = new Map(
    (
      db
        .prepare(`SELECT ${DAY_EXPR} AS day, COUNT(*) AS n ${REVIEWS_OF_USER} AND r.reviewed_at >= ? GROUP BY day`)
        .all(userId, now - HEATMAP_DAYS * DAY_MS) as { day: string; n: number }[]
    ).map((r) => [r.day, r.n]),
  );
  const heatmap = Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const day = dayKey(now - (HEATMAP_DAYS - 1 - i) * DAY_MS);
    return { day, count: perDay.get(day) ?? 0 };
  });

  const decks = (
    db
      .prepare(
        `SELECT d.id, d.name, d.color, COUNT(r.id) AS reviews, COALESCE(SUM(r.correct), 0) AS ok
         FROM decks d
         LEFT JOIN cards c ON c.deck_id = d.id
         LEFT JOIN reviews r ON r.card_id = c.id
         WHERE d.user_id = ?
         GROUP BY d.id ORDER BY d.name`,
      )
      .all(userId) as { id: number; name: string; color: string; reviews: number; ok: number }[]
  ).map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color,
    reviews: d.reviews,
    accuracy: d.reviews > 0 ? d.ok / d.reviews : null,
  }));

  const hard = db
    .prepare(
      `SELECT c.id, c.term, c.meaning, p.lapses, d.name AS deck
       FROM card_progress p JOIN cards c ON c.id = p.card_id JOIN decks d ON d.id = c.deck_id
       WHERE d.user_id = ? AND p.lapses > 0 ORDER BY p.lapses DESC, p.stage ASC LIMIT 10`,
    )
    .all(userId) as StatsData["hard"];

  const stageRows = db
    .prepare(`SELECT p.stage AS stage, COUNT(*) AS n ${PROGRESS_OF_USER} GROUP BY p.stage`)
    .all(userId) as { stage: number; n: number }[];
  const stages: number[] = Array(MAX_STAGE + 1).fill(0);
  for (const r of stageRows) stages[r.stage] = r.n;

  return {
    totalReviews: totals.n,
    accuracy: totals.n > 0 ? totals.ok / totals.n : null,
    streak: computeStreak(activeDays, now),
    bestStreak: bestStreak(activeDays),
    heatmap,
    decks,
    hard,
    stages,
  };
}

export type WeekActivity = { day: string; count: number }[];

/** Repasos de cada uno de los últimos 7 días, para la mini-tarjeta del dashboard. */
export function weekActivity(userId: number, now = Date.now()): WeekActivity {
  const db = getDb();
  const perDay = new Map(
    (
      db
        .prepare(`SELECT ${DAY_EXPR} AS day, COUNT(*) AS n ${REVIEWS_OF_USER} AND r.reviewed_at >= ? GROUP BY day`)
        .all(userId, now - 6 * DAY_MS) as { day: string; n: number }[]
    ).map((r) => [r.day, r.n]),
  );
  return Array.from({ length: 7 }, (_, i) => {
    const day = dayKey(now - (6 - i) * DAY_MS);
    return { day, count: perDay.get(day) ?? 0 };
  });
}

export type StudyFocus = {
  /** Cuántas cartas hay de cada tipo, para el tile "Qué estás estudiando". */
  byKind: Record<CardKind, number>;
  /** Mazos con al menos un repaso en los últimos 7 días, con su cantidad de pendientes. */
  activeDecks: { id: number; name: string; color: string; due: number }[];
};

export function studyFocus(userId: number, now = Date.now()): StudyFocus {
  const db = getDb();
  const kindRows = db
    .prepare(`SELECT c.kind AS kind, COUNT(*) AS n FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ? GROUP BY c.kind`)
    .all(userId) as { kind: CardKind; n: number }[];
  const byKind = Object.fromEntries(CARD_KINDS.map((k) => [k, 0])) as Record<CardKind, number>;
  for (const r of kindRows) byKind[r.kind] = r.n;

  const activeDeckIds = new Set(
    (
      db
        .prepare(
          `SELECT DISTINCT c.deck_id AS id FROM reviews r
           JOIN cards c ON c.id = r.card_id JOIN decks d ON d.id = c.deck_id
           WHERE d.user_id = ? AND r.reviewed_at >= ?`,
        )
        .all(userId, now - 7 * DAY_MS) as { id: number }[]
    ).map((r) => r.id),
  );

  const activeDecks = listDecks(userId, now)
    .filter((d) => activeDeckIds.has(d.id))
    .map((d) => ({ id: d.id, name: d.name, color: d.color, due: d.due }));

  return { byKind, activeDecks };
}
