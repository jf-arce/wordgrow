"use server";

import { redirect } from "next/navigation";
import { signupSchema, loginSchema } from "@/lib/schemas";
import { createUser, getUserByEmail } from "@/lib/db/queries/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { startSession, endSession } from "@/lib/auth/session";
import { getSettings } from "@/lib/db/queries/settings";
import { setThemeCookie, clearThemeCookie } from "@/lib/theme-cookie";
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

  if (await getUserByEmail(email)) return fail("Ya existe una cuenta con ese email.");

  const id = await createUser({ firstName, lastName, email, passwordHash: hashPassword(password) });

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

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    registerFailure(email);
    return fail("Email o contraseña incorrectos.");
  }

  clearFailures(email);
  await startSession(user.id);
  // Sincroniza la cookie de tema con lo que ese usuario tenía guardado, para que el
  // root layout no arranque en "system" en un browser nuevo hasta la próxima vez que
  // entre a Ajustes (ver lib/theme-cookie.ts).
  const { theme } = await getSettings(user.id);
  await setThemeCookie(theme);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  await clearThemeCookie();
  redirect("/ingresar");
}
