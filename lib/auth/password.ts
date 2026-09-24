import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;
const N = 16384; // costo de scrypt; 2^14, razonable para un hash por login sin bloquear el event loop demasiado.

/** Hashea una contraseña como `scrypt$N$saltHex$hashHex`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN, { N });
  return `scrypt$${N}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Compara en tiempo constante. Devuelve false ante cualquier hash mal formado. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  if (!Number.isFinite(n) || salt.length === 0 || expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length, { N: n });
  return timingSafeEqual(actual, expected);
}
