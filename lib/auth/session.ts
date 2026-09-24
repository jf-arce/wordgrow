import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createSession, deleteSession, getSession, touchSession } from "@/lib/db/queries/auth";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

/** Nunca se guarda el token en la base, sólo su hash: si alguien lee la tabla no puede robar sesiones. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_MS;
  createSession({ id: hashToken(token), userId, expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

/** Devuelve el userId de la cookie actual, o null. Renueva la expiración (sesión deslizante). */
export async function readSession(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = getSession(hashToken(token));
  if (!session) return null;

  const expiresAt = Date.now() + SESSION_MS;
  touchSession(hashToken(token), expiresAt);
  return session.userId;
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(hashToken(token));
  store.delete(SESSION_COOKIE);
}
