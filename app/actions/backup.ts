"use server";

import { revalidatePath } from "next/cache";
import { exportAll, importAll, resetAll } from "@/lib/db/queries/backup";
import { requireUser } from "@/lib/auth/dal";
import { done, fail, type ActionResult } from "./result";

export async function exportBackupAction(): Promise<ActionResult<{ json: string; filename: string }>> {
  const user = await requireUser();
  const stamp = new Date().toISOString().slice(0, 10);
  return done({ json: JSON.stringify(exportAll(user.id), null, 2), filename: `wordgrow-backup-${stamp}.json` });
}

export async function importBackupAction(json: string): Promise<ActionResult<{ decks: number; cards: number }>> {
  const user = await requireUser();
  if (typeof json !== "string" || json.length > 25_000_000) return fail("El archivo es demasiado grande.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return fail("El archivo no es un JSON válido.");
  }
  try {
    const result = importAll(user.id, parsed);
    revalidatePath("/", "layout");
    return done(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No se pudo importar el backup.");
  }
}

export async function resetAllAction(): Promise<ActionResult> {
  const user = await requireUser();
  resetAll(user.id);
  revalidatePath("/", "layout");
  return done(undefined);
}
