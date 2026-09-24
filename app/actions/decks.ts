"use server";

import { revalidatePath } from "next/cache";
import { deckSchema } from "@/lib/schemas";
import { createDeck, deleteDeck, updateDeck } from "@/lib/db/queries/decks";
import { importCards, seedSampleCardStages } from "@/lib/db/queries/cards";
import { SAMPLE_CARDS, SAMPLE_DECK } from "@/lib/sample-deck";
import { requireUser } from "@/lib/auth/dal";
import { done, fail, type ActionResult } from "./result";

export async function createDeckAction(input: unknown): Promise<ActionResult<{ id: number }>> {
  const user = await requireUser();
  const parsed = deckSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const id = await createDeck(user.id, parsed.data);
  revalidatePath("/", "layout");
  return done({ id });
}

export async function updateDeckAction(id: number, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = deckSchema.safeParse(input);
  if (!parsed.success || !Number.isInteger(id)) {
    return fail(parsed.success ? "Mazo inválido." : parsed.error.issues[0].message);
  }
  await updateDeck(user.id, id, parsed.data);
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function deleteDeckAction(id: number): Promise<ActionResult> {
  const user = await requireUser();
  if (!Number.isInteger(id)) return fail("Mazo inválido.");
  await deleteDeck(user.id, id);
  revalidatePath("/", "layout");
  return done(undefined);
}

export async function createSampleDeckAction(): Promise<ActionResult<{ id: number }>> {
  const user = await requireUser();
  const id = await createDeck(user.id, SAMPLE_DECK);
  await importCards(user.id, id, SAMPLE_CARDS);
  await seedSampleCardStages(user.id, id);
  revalidatePath("/", "layout");
  return done({ id });
}
