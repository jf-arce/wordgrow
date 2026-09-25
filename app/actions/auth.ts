"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { signupSchema, loginSchema } from "@/lib/schemas";
import { auth } from "@/lib/auth/server";
import { getSettings } from "@/lib/db/queries/settings";
import { setThemeCookie, clearThemeCookie } from "@/lib/theme-cookie";
import { fail, type ActionResult } from "./result";

export async function signupAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { firstName, lastName, email, password } = parsed.data;

  try {
    const result = await auth.api.signUpEmail({
      body: { name: `${firstName} ${lastName}`, firstName, lastName, email, password },
      headers: await headers(),
    });
    // La meta diaria y el resto de las preferencias ya quedan en 20/default; /bienvenida las
    // deja configurar todas juntas antes de que la persona vea la app vacía.
    void result;
  } catch (error) {
    if (error instanceof APIError) return fail(mapSignupError(error));
    throw error;
  }
  redirect("/bienvenida");
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { email, password } = parsed.data;

  let userId: string;
  try {
    const result = await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
    userId = result.user.id;
  } catch (error) {
    if (error instanceof APIError) return fail("Email o contraseña incorrectos.");
    throw error;
  }

  // Sincroniza la cookie de tema con lo que ese usuario tenía guardado, para que el
  // root layout no arranque en "system" en un browser nuevo hasta la próxima vez que
  // entre a Ajustes (ver lib/theme-cookie.ts).
  const { theme } = await getSettings(userId);
  await setThemeCookie(theme);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  await clearThemeCookie();
  redirect("/ingresar");
}

function mapSignupError(error: APIError): string {
  if (error.status === "UNPROCESSABLE_ENTITY") return "Ya existe una cuenta con ese email.";
  return error.body?.message ?? "No pudimos crear la cuenta. Probá de nuevo.";
}
