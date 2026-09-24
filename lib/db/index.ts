import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS, MIGRATIONS_NEEDING_FK_OFF } from "./schema";

const globalForDb = globalThis as unknown as { __wordgrowDb?: DatabaseSync };

function open(): DatabaseSync {
  const file = process.env.WORDGROW_DB ?? path.join(process.cwd(), "data", "wordgrow.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync) {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let v = row.user_version; v < MIGRATIONS.length; v++) {
    // PRAGMA foreign_keys no tiene efecto si se cambia dentro de una transacción ya
    // abierta, así que las migraciones que reconstruyen una tabla referenciada por FK
    // necesitan desactivarlo ANTES del BEGIN y reactivarlo después del COMMIT/ROLLBACK.
    const needsFkOff = MIGRATIONS_NEEDING_FK_OFF.has(v);
    if (needsFkOff) db.exec("PRAGMA foreign_keys = OFF");
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec("COMMIT");
      if (needsFkOff) {
        const bad = db.prepare("PRAGMA foreign_key_check").all();
        if (bad.length > 0) throw new Error(`foreign_key_check falló tras la migración ${v}: ${JSON.stringify(bad)}`);
      }
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    } finally {
      if (needsFkOff) db.exec("PRAGMA foreign_keys = ON");
    }
  }
}

/** Conexión única, también entre recargas en desarrollo. */
export function getDb(): DatabaseSync {
  globalForDb.__wordgrowDb ??= open();
  return globalForDb.__wordgrowDb;
}

/** Corre `fn` dentro de una transacción. */
export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
