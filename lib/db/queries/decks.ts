import "server-only";
import { getDb } from "../index";
import type { DeckInput } from "@/lib/schemas";
import { MAX_STAGE } from "@/lib/srs";

export type DeckSummary = {
  id: number;
  name: string;
  description: string;
  color: string;
  lang: string;
  total: number;
  due: number;
  mastered: number;
  /** Cantidad de tarjetas por etapa 0..MAX_STAGE. */
  stages: number[];
};

type DeckRow = Omit<DeckSummary, "stages" | "total" | "due" | "mastered"> & {
  total: number;
  due: number;
  mastered: number;
};

export function listDecks(userId: number, now = Date.now()): DeckSummary[] {
  const db = getDb();
  const decks = db
    .prepare(
      `SELECT d.id, d.name, d.description, d.color, d.lang,
              COUNT(c.id) AS total,
              COALESCE(SUM(p.due_at <= ?), 0) AS due,
              COALESCE(SUM(p.stage = ${MAX_STAGE}), 0) AS mastered
       FROM decks d
       LEFT JOIN cards c ON c.deck_id = d.id
       LEFT JOIN card_progress p ON p.card_id = c.id
       WHERE d.user_id = ?
       GROUP BY d.id
       ORDER BY d.created_at DESC, d.id DESC`,
    )
    .all(now, userId) as DeckRow[];

  const stageRows = db
    .prepare(
      `SELECT c.deck_id AS deck_id, p.stage AS stage, COUNT(*) AS n
       FROM cards c JOIN card_progress p ON p.card_id = c.id
       JOIN decks d ON d.id = c.deck_id
       WHERE d.user_id = ?
       GROUP BY c.deck_id, p.stage`,
    )
    .all(userId) as { deck_id: number; stage: number; n: number }[];

  const byDeck = new Map<number, number[]>();
  for (const r of stageRows) {
    const arr = byDeck.get(r.deck_id) ?? Array(MAX_STAGE + 1).fill(0);
    arr[r.stage] = r.n;
    byDeck.set(r.deck_id, arr);
  }

  return decks.map((d) => ({ ...d, stages: byDeck.get(d.id) ?? Array(MAX_STAGE + 1).fill(0) }));
}

export function getDeck(userId: number, id: number): DeckSummary | null {
  return listDecks(userId).find((d) => d.id === id) ?? null;
}

/** Verifica que el mazo exista y sea del usuario, para no dejar tocar tarjetas ajenas por id. */
export function userOwnsDeck(userId: number, deckId: number): boolean {
  const row = getDb().prepare("SELECT 1 FROM decks WHERE id = ? AND user_id = ?").get(deckId, userId);
  return !!row;
}

/** Igual que `userOwnsDeck`, pero a partir del id de una tarjeta (para acciones sobre cartas sueltas). */
export function userOwnsCard(userId: number, cardId: number): boolean {
  const row = getDb()
    .prepare("SELECT 1 FROM cards c JOIN decks d ON d.id = c.deck_id WHERE c.id = ? AND d.user_id = ?")
    .get(cardId, userId);
  return !!row;
}

export function createDeck(userId: number, input: DeckInput): number {
  const now = Date.now();
  const res = getDb()
    .prepare(
      `INSERT INTO decks (name, description, color, lang, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(input.name, input.description, input.color, input.lang, userId, now, now);
  return Number(res.lastInsertRowid);
}

export function updateDeck(userId: number, id: number, input: DeckInput): void {
  getDb()
    .prepare(`UPDATE decks SET name = ?, description = ?, color = ?, lang = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
    .run(input.name, input.description, input.color, input.lang, Date.now(), id, userId);
}

export function deleteDeck(userId: number, id: number): void {
  getDb().prepare("DELETE FROM decks WHERE id = ? AND user_id = ?").run(id, userId);
}
