"use server";

import { redirect } from "next/navigation";
import { signupSchema, loginSchema } from "@/lib/schemas";
import { createUser, getUserByEmail, hasAnyUser, adoptOrphanData } from "@/lib/db/queries/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { startSession, endSession } from "@/lib/auth/session";
import { fail, type ActionResult } from "./result";

// Freno simple de fuerza bruta: contador en memoria por email, con demora creciente.
// Alcanza para un uso personal/chico; no sustituye un límite por IP en un despliegue público.
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 6;

function throttled(email: string): number {
  const a = attempts.get(email);
  if (!a) return 0;
  return Math.max(0, a.blockedUntil - Date.now());
}

function registerFailure(email: string) {
  const a = attempts.get(email) ?? { count: 0, blockedUntil: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.blockedUntil = Date.now() + Math.min(30_000, 2 ** (a.count - MAX_ATTEMPTS) * 1000);
  }
  attempts.set(email, a);
}

function clearFailures(email: string) {
  attempts.delete(email);
}

export async function signupAction(input: unknown): Promise<ActionResult<{ id: number }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { firstName, lastName, email, password } = parsed.data;

  if (getUserByEmail(email)) return fail("Ya existe una cuenta con ese email.");

  const wasFirstUser = !hasAnyUser();
  const id = createUser({ firstName, lastName, email, passwordHash: hashPassword(password) });

  if (wasFirstUser) {
    // Los mazos y ajustes que ya existían en esta instalación pasan a ser de la primera cuenta.
    adoptOrphanData(id);
  }

  await startSession(id);
  // La meta diaria y el resto de las preferencias ya quedan en 20/default; /bienvenida las
  // deja configurar todas juntas antes de que la persona vea la app vacía.
  redirect("/bienvenida");
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { email, password } = parsed.data;

  const waitMs = throttled(email);
  if (waitMs > 0) return fail(`Demasiados intentos. Probá de nuevo en ${Math.ceil(waitMs / 1000)}s.`);

  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    registerFailure(email);
    return fail("Email o contraseña incorrectos.");
  }

  clearFailures(email);
  await startSession(user.id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/ingresar");
}
