import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS, MIGRATIONS_NEEDING_FK_OFF } from "@/lib/db/schema";

/**
 * Corre las migraciones tal como lo hace `migrate()` en `lib/db/index.ts` (mismo orden,
 * mismo tratamiento de `PRAGMA foreign_keys` fuera de la transacción para las que lo
 * necesitan), pero contra una base armada a mano para poder sembrar datos "legacy" antes
 * de que exista la migración de taxonomía nueva.
 */
function runMigrations(db: DatabaseSync, from: number, upTo: number) {
  for (let v = from; v < upTo; v++) {
    const needsFkOff = MIGRATIONS_NEEDING_FK_OFF.has(v);
    if (needsFkOff) db.exec("PRAGMA foreign_keys = OFF");
    db.exec("BEGIN");
    db.exec(MIGRATIONS[v]);
    db.exec("COMMIT");
    if (needsFkOff) db.exec("PRAGMA foreign_keys = ON");
  }
}

describe("migración de taxonomía de tipos de carta", () => {
  it("preserva filas y referencias de card_progress/reviews al reconstruir cards", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");

    // Aplica todo hasta (sin incluir) la migración de taxonomía nueva, con datos legacy.
    const kindMigrationIndex = MIGRATIONS.findIndex((migration) => migration.includes("CREATE TABLE cards_new"));
    runMigrations(db, 0, kindMigrationIndex);

    const now = Date.now();
    db.exec(`INSERT INTO users (id, first_name, last_name, email, password_hash, created_at)
             VALUES (1, 'A', 'B', 'a@b.com', 'x', ${now})`);
    db.exec(`INSERT INTO decks (id, name, description, color, lang, user_id, created_at, updated_at)
             VALUES (1, 'Mazo', '', 'leaf', 'en-US', 1, ${now}, ${now})`);

    const kinds = ["word", "phrase", "phrasal_verb", "idiom", "other"];
    for (const [i, kind] of kinds.entries()) {
      const id = i + 1;
      db.exec(
        `INSERT INTO cards (id, deck_id, term, meaning, example, notes, kind, created_at)
         VALUES (${id}, 1, 'term${id}', 'meaning${id}', '', '', '${kind}', ${now})`,
      );
      db.exec(`INSERT INTO card_progress (card_id, stage, due_at, reps, lapses) VALUES (${id}, 0, ${now}, 0, 0)`);
      db.exec(
        `INSERT INTO reviews (card_id, mode, correct, grade, response_ms, reviewed_at)
         VALUES (${id}, 'typed', 1, 'correct', 500, ${now})`,
      );
    }

    // Corre la migración de taxonomía sola.
    runMigrations(db, kindMigrationIndex, kindMigrationIndex + 1);

    const cardCount = (db.prepare("SELECT COUNT(*) AS n FROM cards").get() as { n: number }).n;
    const progressCount = (db.prepare("SELECT COUNT(*) AS n FROM card_progress").get() as { n: number }).n;
    const reviewCount = (db.prepare("SELECT COUNT(*) AS n FROM reviews").get() as { n: number }).n;
    expect(cardCount).toBe(5);
    expect(progressCount).toBe(5);
    expect(reviewCount).toBe(5);

    const fkProblems = db.prepare("PRAGMA foreign_key_check").all();
    expect(fkProblems).toHaveLength(0);

    const rows = db.prepare("SELECT id, kind, legacy_kind FROM cards ORDER BY id").all() as {
      id: number;
      kind: string;
      legacy_kind: string | null;
    }[];
    expect(rows.map((r) => r.kind)).toEqual(["word", "collocation", "phrasal_verb", "collocation", "other"]);
    expect(rows.map((r) => r.legacy_kind)).toEqual([null, "phrase", null, "idiom", null]);

    // Las referencias de card_progress/reviews siguen resolviendo a los mismos ids.
    const progressCardIds = (db.prepare("SELECT card_id FROM card_progress ORDER BY card_id").all() as { card_id: number }[]).map(
      (r) => r.card_id,
    );
    expect(progressCardIds).toEqual([1, 2, 3, 4, 5]);

    db.close();
  });
});

describe("migración de sesiones en curso", () => {
  it("restaura la corrección ya guardada en una sesión anterior", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    runMigrations(db, 0, MIGRATIONS.length - 1);
    db.prepare("INSERT INTO users (id, first_name, last_name, email, password_hash, created_at) VALUES (1, 'A', 'B', 'legacy@example.com', 'x', 1)").run();
    const item = { cardId: 7, mode: "typed", term: "cat", answer: "cat", retry: false };
    db.prepare("INSERT INTO study_sessions (user_id, deck_ids, source, mode, limit_n, items, answers, position, started_at, updated_at) VALUES (1, '', 'all', 'typed', 1, ?, ?, 0, 1, 1)").run(JSON.stringify([item]), JSON.stringify([{ item, result: "correct", stageAfter: 1 }]));
    runMigrations(db, MIGRATIONS.length - 1, MIGRATIONS.length);
    const row = db.prepare("SELECT current_answer FROM study_sessions").get() as { current_answer: string };
    expect(JSON.parse(row.current_answer)).toEqual({ result: "correct", stageAfter: 1 });
    db.close();
  });
});
