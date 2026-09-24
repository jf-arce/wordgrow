import "server-only";
import { getDb, transaction } from "../index";
import { migrateLegacyKind } from "@/lib/quiz";

type Backup = {
  app: "wordgrow";
  version: 1;
  exportedAt: number;
  decks: Record<string, unknown>[];
  cards: Record<string, unknown>[];
  progress: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  settings: { key: string; value: string }[];
};

export function exportAll(userId: number): Backup {
  const db = getDb();
  const decks = db.prepare("SELECT * FROM decks WHERE user_id = ?").all(userId) as Backup["decks"];
  const deckIds = decks.map((d) => d.id as number);
  const inClause = deckIds.length ? `(${deckIds.map(() => "?").join(",")})` : "(-1)";

  const cards = deckIds.length
    ? (db.prepare(`SELECT * FROM cards WHERE deck_id IN ${inClause}`).all(...deckIds) as Backup["cards"])
    : [];
  const cardIds = cards.map((c) => c.id as number);
  const cardsIn = cardIds.length ? `(${cardIds.map(() => "?").join(",")})` : "(-1)";

  const progress = cardIds.length
    ? (db.prepare(`SELECT * FROM card_progress WHERE card_id IN ${cardsIn}`).all(...cardIds) as Backup["progress"])
    : [];
  const reviews = cardIds.length
    ? (db.prepare(`SELECT * FROM reviews WHERE card_id IN ${cardsIn}`).all(...cardIds) as Backup["reviews"])
    : [];
  const settings = db.prepare("SELECT key, value FROM settings WHERE user_id = ?").all(userId) as Backup["settings"];

  return { app: "wordgrow", version: 1, exportedAt: Date.now(), decks, cards, progress, reviews, settings };
}

function isBackup(value: unknown): value is Backup {
  const b = value as Backup;
  return (
    !!b &&
    b.app === "wordgrow" &&
    b.version === 1 &&
    Array.isArray(b.decks) &&
    Array.isArray(b.cards) &&
    Array.isArray(b.progress) &&
    Array.isArray(b.reviews) &&
    Array.isArray(b.settings)
  );
}

/** Reemplaza todo el contenido del usuario por el del backup. Todo o nada. */
export function importAll(userId: number, value: unknown): { decks: number; cards: number } {
  if (!isBackup(value)) throw new Error("El archivo no es un backup de WordGrow.");
  return transaction((db) => {
    // Borra sólo los datos de este usuario: reviews/progreso/cartas cuelgan de sus mazos.
    db.prepare(
      `DELETE FROM reviews WHERE card_id IN (SELECT c.id FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ?)`,
    ).run(userId);
    db.prepare(
      `DELETE FROM card_progress WHERE card_id IN (SELECT c.id FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ?)`,
    ).run(userId);
    db.prepare(`DELETE FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE user_id = ?)`).run(userId);
    db.prepare(`DELETE FROM decks WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM settings WHERE user_id = ?`).run(userId);

    // Los nombres de columna salen del propio archivo; se validan contra el esquema real.
    const guard = (table: string, rows: Record<string, unknown>[]) => {
      const cols = new Set(
        (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name),
      );
      for (const row of rows) {
        for (const k of Object.keys(row)) {
          if (!cols.has(k)) throw new Error(`Columna desconocida "${k}" en ${table}.`);
        }
      }
    };
    guard("decks", value.decks);
    guard("cards", value.cards);
    guard("card_progress", value.progress);
    guard("reviews", value.reviews);
    guard("settings", value.settings);

    // Los ids del archivo son de otra base: se remapean a ids nuevos y siempre a este usuario.
    const deckIdMap = new Map<number, number>();
    for (const row of value.decks) {
      const oldId = row.id as number;
      const keys = Object.keys(row).filter((k) => k !== "id" && k !== "user_id");
      const res = db
        .prepare(`INSERT INTO decks (user_id, ${keys.join(",")}) VALUES (?, ${keys.map(() => "?").join(",")})`)
        .run(userId, ...(keys.map((k) => row[k]) as (string | number | null)[]));
      deckIdMap.set(oldId, Number(res.lastInsertRowid));
    }

    const cardIdMap = new Map<number, number>();
    for (const rawRow of value.cards) {
      // Backups exportados antes del cambio de taxonomía traen valores viejos de `kind`
      // (idiom/phrase) que violarían el CHECK actual si se insertan tal cual.
      const row = typeof rawRow.kind === "string" ? { ...rawRow, kind: migrateLegacyKind(rawRow.kind) ?? "other" } : rawRow;
      const oldId = row.id as number;
      const newDeckId = deckIdMap.get(row.deck_id as number);
      if (newDeckId === undefined) continue;
      const keys = Object.keys(row).filter((k) => k !== "id" && k !== "deck_id");
      const res = db
        .prepare(`INSERT INTO cards (deck_id, ${keys.join(",")}) VALUES (?, ${keys.map(() => "?").join(",")})`)
        .run(newDeckId, ...(keys.map((k) => row[k]) as (string | number | null)[]));
      cardIdMap.set(oldId, Number(res.lastInsertRowid));
    }

    for (const row of value.progress) {
      const newCardId = cardIdMap.get(row.card_id as number);
      if (newCardId === undefined) continue;
      const keys = Object.keys(row).filter((k) => k !== "card_id");
      db.prepare(`INSERT INTO card_progress (card_id, ${keys.join(",")}) VALUES (?, ${keys.map(() => "?").join(",")})`).run(
        newCardId,
        ...(keys.map((k) => row[k]) as (string | number | null)[]),
      );
    }

    for (const row of value.reviews) {
      const newCardId = cardIdMap.get(row.card_id as number);
      if (newCardId === undefined) continue;
      const keys = Object.keys(row).filter((k) => k !== "id" && k !== "card_id");
      db.prepare(`INSERT INTO reviews (card_id, ${keys.join(",")}) VALUES (?, ${keys.map(() => "?").join(",")})`).run(
        newCardId,
        ...(keys.map((k) => row[k]) as (string | number | null)[]),
      );
    }

    for (const row of value.settings) {
      db.prepare(
        "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
      ).run(userId, row.key, row.value);
    }

    return { decks: value.decks.length, cards: value.cards.length };
  });
}

export function resetAll(userId: number): void {
  transaction((db) => {
    db.prepare(
      `DELETE FROM reviews WHERE card_id IN (SELECT c.id FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ?)`,
    ).run(userId);
    db.prepare(
      `DELETE FROM card_progress WHERE card_id IN (SELECT c.id FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ?)`,
    ).run(userId);
    db.prepare(`DELETE FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE user_id = ?)`).run(userId);
    db.prepare(`DELETE FROM decks WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM settings WHERE user_id = ?`).run(userId);
  });
}
