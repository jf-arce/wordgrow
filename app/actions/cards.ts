"use server";

import { revalidatePath } from "next/cache";
import { cardSchema, importSchema } from "@/lib/schemas";
import { createCard, deleteCard, importCards, resetCardProgress, updateCard } from "@/lib/db/queries/cards";
import { requireUser } from "@/lib/auth/dal";
import { done, fail, type ActionResult } from "./result";

export async function createCardAction(deckId: number, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = cardSchema.safeParse(input);
  if (!parsed.success || !Number.isInteger(deckId)) {
    return fail(parsed.success ? "Mazo inválido." : parsed.error.issues[0].message);
  }
  if (!createCard(user.id, deckId, parsed.data)) return fail("Esa palabra ya está en el mazo.");
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function updateCardAction(id: number, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = cardSchema.safeParse(input);
  if (!parsed.success || !Number.isInteger(id)) {
    return fail(parsed.success ? "Tarjeta inválida." : parsed.error.issues[0].message);
  }
  if (!updateCard(user.id, id, parsed.data)) return fail("Ya hay otra tarjeta con esa palabra en el mazo.");
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function deleteCardAction(id: number): Promise<ActionResult> {
  const user = await requireUser();
  if (!Number.isInteger(id)) return fail("Tarjeta inválida.");
  deleteCard(user.id, id);
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function resetCardAction(id: number): Promise<ActionResult> {
  const user = await requireUser();
  if (!Number.isInteger(id)) return fail("Tarjeta inválida.");
  resetCardProgress(user.id, id);
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function importCardsAction(input: unknown): Promise<ActionResult<{ added: number; skipped: number }>> {
  const user = await requireUser();
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) return fail("Hay filas con datos inválidos. Revisá el preview.");
  const result = importCards(user.id, parsed.data.deckId, parsed.data.rows);
  revalidatePath("/", "layout");
  return done(result);
}
