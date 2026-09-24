import "server-only";
import { getDb, transaction } from "../index";
import type { CardInput } from "@/lib/schemas";
import type { CardKind } from "@/lib/quiz";
import { MAX_STAGE, stageInfo } from "@/lib/srs";
import { userOwnsCard, userOwnsDeck } from "./decks";

export type CardRow = {
  id: number;
  deckId: number;
  term: string;
  meaning: string;
  example: string;
  notes: string;
  kind: CardKind;
  stage: number;
  dueAt: number;
  reps: number;
  lapses: number;
  due: boolean;
};

type Filters = { q?: string; stage?: number; kind?: CardKind };

export function listCards(userId: number, deckId: number, filters: Filters = {}, now = Date.now()): CardRow[] {
  if (!userOwnsDeck(userId, deckId)) return [];
  const where = ["c.deck_id = ?"];
  const args: (string | number)[] = [deckId];
  if (filters.q) {
    where.push("(c.term LIKE ? ESCAPE '\\' OR c.meaning LIKE ? ESCAPE '\\')");
    const like = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    args.push(like, like);
  }
  if (filters.stage !== undefined) {
    where.push("p.stage = ?");
    args.push(filters.stage);
  }
  if (filters.kind) {
    where.push("c.kind = ?");
    args.push(filters.kind);
  }
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.deck_id AS deckId, c.term, c.meaning, c.example, c.notes, c.kind,
              p.stage, p.due_at AS dueAt, p.reps, p.lapses
       FROM cards c JOIN card_progress p ON p.card_id = c.id
       WHERE ${where.join(" AND ")}
       ORDER BY c.created_at DESC, c.id DESC`,
    )
    .all(...args) as Omit<CardRow, "due">[];
  return rows.map((r) => ({ ...r, due: r.dueAt <= now }));
}

export function existingTerms(userId: number, deckId: number): string[] {
  if (!userOwnsDeck(userId, deckId)) return [];
  const rows = getDb().prepare("SELECT term FROM cards WHERE deck_id = ?").all(deckId) as { term: string }[];
  return rows.map((r) => r.term);
}

function insertCard(deckId: number, input: CardInput, createdAt: number, dueAt: number): number | null {
  const db = getDb();
  const res = db
    .prepare(
      `INSERT OR IGNORE INTO cards (deck_id, term, meaning, example, notes, kind, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(deckId, input.term, input.meaning, input.example, input.notes, input.kind, createdAt);
  if (res.changes === 0) return null;
  const id = Number(res.lastInsertRowid);
  db.prepare("INSERT INTO card_progress (card_id, stage, due_at) VALUES (?, 0, ?)").run(id, dueAt);
  return id;
}

/** Devuelve false si ya existe esa palabra en el mazo, o si el mazo no es del usuario. */
export function createCard(userId: number, deckId: number, input: CardInput): boolean {
  if (!userOwnsDeck(userId, deckId)) return false;
  const now = Date.now();
  return insertCard(deckId, input, now, now) !== null;
}

export function importCards(userId: number, deckId: number, rows: CardInput[]): { added: number; skipped: number } {
  if (!userOwnsDeck(userId, deckId)) return { added: 0, skipped: rows.length };
  const now = Date.now();
  return transaction(() => {
    let added = 0;
    rows.forEach((row, i) => {
      // La lista se muestra de la más nueva a la más vieja: la primera fila importada queda arriba.
      if (insertCard(deckId, row, now + (rows.length - i), now) !== null) added++;
    });
    return { added, skipped: rows.length - added };
  });
}

/** Reparte los rangos del mazo de ejemplo sin modificar cartas ya repasadas. */
export function seedSampleCardStages(userId: number, deckId: number): number {
  if (!userOwnsDeck(userId, deckId)) return 0;
  const now = Date.now();
  return transaction((db) => {
    const cards = db
      .prepare(
        `SELECT c.id FROM cards c
         WHERE c.deck_id = ?
         ORDER BY c.created_at DESC, c.id DESC`,
      )
      .all(deckId) as { id: number }[];
    const update = db.prepare(
      `UPDATE card_progress SET stage = ?, due_at = ?, reps = ?, last_reviewed_at = ?
       WHERE card_id = ? AND stage = 0 AND reps = 0 AND lapses = 0 AND last_reviewed_at IS NULL`,
    );
    let changed = 0;
    cards.forEach(({ id }, index) => {
      const stage = index % (MAX_STAGE + 1);
      if (stage === 0) return;
      const dueAt = now + stageInfo(stage).intervalDays * 24 * 60 * 60 * 1000;
      changed += Number(update.run(stage, dueAt, stage, now, id).changes);
    });
    return changed;
  });
}

/** Devuelve false si el nuevo término choca con otra tarjeta del mazo, o si la tarjeta no es del usuario. */
export function updateCard(userId: number, id: number, input: CardInput): boolean {
  if (!userOwnsCard(userId, id)) return false;
  try {
    getDb()
      .prepare("UPDATE cards SET term = ?, meaning = ?, example = ?, notes = ?, kind = ? WHERE id = ?")
      .run(input.term, input.meaning, input.example, input.notes, input.kind, id);
    return true;
  } catch (error) {
    if (error instanceof Error && /UNIQUE/i.test(error.message)) return false;
    throw error;
  }
}

export function deleteCard(userId: number, id: number): void {
  if (!userOwnsCard(userId, id)) return;
  getDb().prepare("DELETE FROM cards WHERE id = ?").run(id);
}

export function resetCardProgress(userId: number, id: number): void {
  if (!userOwnsCard(userId, id)) return;
  getDb()
    .prepare("UPDATE card_progress SET stage = 0, due_at = ?, reps = 0, lapses = 0, last_reviewed_at = NULL WHERE card_id = ?")
    .run(Date.now(), id);
}
