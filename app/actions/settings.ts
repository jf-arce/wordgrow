"use server";

import { revalidatePath } from "next/cache";
import { settingsSchema, studyPrefsSchema, reminderPrefsSchema } from "@/lib/schemas";
import { saveSettings, saveStudyPrefs, saveReminderPrefs } from "@/lib/db/queries/settings";
import { requireUser } from "@/lib/auth/dal";
import { userOwnsDeck } from "@/lib/db/queries/decks";
import { setThemeCookie } from "@/lib/theme-cookie";
import { done, fail, type ActionResult } from "./result";

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  await saveSettings(user.id, parsed.data);
  // El root layout lee el tema de esta cookie (sin ir a la base) para pintar
  // <html data-theme> antes del primer paint; ver lib/theme-cookie.ts.
  await setThemeCookie(parsed.data.theme);
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function saveStudyPrefsAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = studyPrefsSchema.safeParse(input);
  if (!parsed.success) return fail("Revisá la configuración de estudio.");
  if (parsed.data.deckScope === "selected") {
    const owns = await Promise.all(parsed.data.deckIds.map((id) => userOwnsDeck(user.id, id)));
    if (owns.some((ok) => !ok)) return fail("Uno de los mazos ya no está disponible.");
  }
  await saveStudyPrefs(user.id, parsed.data);
  // El botón "Estudiar" del inicio resuelve la sesión con estas prefs
  // (`resolveStudyHref`); sin revalidar, un cambio de mazos desde el acceso rápido del
  // dashboard no se refleja ahí hasta la próxima recarga completa.
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function saveReminderPrefsAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reminderPrefsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  await saveReminderPrefs(user.id, parsed.data);
  revalidatePath("/", "layout");
  return done(undefined);
}
