import "server-only";
import { getDb } from "../index";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type UserRow = User & { passwordHash: string };

export function createUser(input: { firstName: string; lastName: string; email: string; passwordHash: string }): number {
  const res = getDb()
    .prepare(
      `INSERT INTO users (first_name, last_name, email, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.firstName, input.lastName, input.email, input.passwordHash, Date.now());
  return Number(res.lastInsertRowid);
}

export function getUserByEmail(email: string): UserRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, first_name AS firstName, last_name AS lastName, email, password_hash AS passwordHash
       FROM users WHERE email = ? COLLATE NOCASE`,
    )
    .get(email) as UserRow | undefined;
  return row ?? null;
}

export function getUserById(id: number): User | null {
  const row = getDb()
    .prepare(`SELECT id, first_name AS firstName, last_name AS lastName, email FROM users WHERE id = ?`)
    .get(id) as User | undefined;
  return row ?? null;
}

export function createSession(input: { id: string; userId: number; expiresAt: number }): void {
  const now = Date.now();
  getDb()
    .prepare(`INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)`)
    .run(input.id, input.userId, now, input.expiresAt, now);
}

export function getSession(id: string, now = Date.now()): { userId: number; expiresAt: number } | null {
  const row = getDb().prepare(`SELECT user_id AS userId, expires_at AS expiresAt FROM sessions WHERE id = ?`).get(id) as
    | { userId: number; expiresAt: number }
    | undefined;
  if (!row || row.expiresAt <= now) return null;
  return row;
}

export function touchSession(id: string, expiresAt: number): void {
  getDb().prepare(`UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?`).run(Date.now(), expiresAt, id);
}

export function deleteSession(id: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
}

/** Mueve los mazos y ajustes que existían antes de que hubiera cuentas a la primera cuenta creada. */
export function adoptOrphanData(userId: number): void {
  const db = getDb();
  db.prepare(`UPDATE decks SET user_id = ? WHERE user_id IS NULL`).run(userId);
  db.prepare(`UPDATE settings SET user_id = ? WHERE user_id = 0`).run(userId);
}

export function hasAnyUser(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number };
  return row.n > 0;
}
