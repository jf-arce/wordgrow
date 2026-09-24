"use server";

import { revalidatePath } from "next/cache";
import { settingsSchema, studyPrefsSchema, reminderPrefsSchema } from "@/lib/schemas";
import { saveSettings, saveStudyPrefs, saveReminderPrefs } from "@/lib/db/queries/settings";
import { requireUser } from "@/lib/auth/dal";
import { userOwnsDeck } from "@/lib/db/queries/decks";
import { done, fail, type ActionResult } from "./result";

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  saveSettings(user.id, parsed.data);
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function saveStudyPrefsAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = studyPrefsSchema.safeParse(input);
  if (!parsed.success) return fail("Revisá la configuración de estudio.");
  if (parsed.data.deckScope === "selected" && parsed.data.deckIds.some((id) => !userOwnsDeck(user.id, id))) return fail("Uno de los mazos ya no está disponible.");
  saveStudyPrefs(user.id, parsed.data);
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
  saveReminderPrefs(user.id, parsed.data);
  revalidatePath("/", "layout");
  return done(undefined);
}
