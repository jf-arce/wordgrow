import "server-only";
import { prisma } from "../index";
import { Prisma } from "@/lib/generated/prisma/client";
import type { CardInput } from "@/lib/schemas";
import type { CardKind } from "@/lib/quiz";
import { MAX_STAGE, stageInfo } from "@/lib/srs";
import { userOwnsCard, userOwnsDeck } from "./decks";

export type CardRow = {
  id: number;
  deckId: number;
  term: string;
  meaning: string;
  example: string;
  notes: string;
  kind: CardKind;
  stage: number;
  dueAt: number;
  reps: number;
  lapses: number;
  due: boolean;
};

type Filters = { q?: string; stage?: number; kind?: CardKind };

export async function listCards(userId: number, deckId: number, filters: Filters = {}, now = Date.now()): Promise<CardRow[]> {
  if (!(await userOwnsDeck(userId, deckId))) return [];
  const rows = await prisma.card.findMany({
    where: {
      deckId,
      ...(filters.q ? { OR: [{ term: { contains: filters.q, mode: "insensitive" } }, { meaning: { contains: filters.q, mode: "insensitive" } }] } : {}),
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.stage !== undefined ? { progress: { stage: filters.stage } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      deckId: true,
      term: true,
      meaning: true,
      example: true,
      notes: true,
      kind: true,
      progress: { select: { stage: true, dueAt: true, reps: true, lapses: true } },
    },
  });
  return rows
    .filter((r) => r.progress !== null)
    .map((r) => ({
      id: r.id,
      deckId: r.deckId,
      term: r.term,
      meaning: r.meaning,
      example: r.example,
      notes: r.notes,
      kind: r.kind,
      stage: r.progress!.stage,
      dueAt: r.progress!.dueAt.getTime(),
      reps: r.progress!.reps,
      lapses: r.progress!.lapses,
      due: r.progress!.dueAt.getTime() <= now,
    }));
}

export async function existingTerms(userId: number, deckId: number): Promise<string[]> {
  if (!(await userOwnsDeck(userId, deckId))) return [];
  const rows = await prisma.card.findMany({ where: { deckId }, select: { term: true } });
  return rows.map((r) => r.term);
}

async function insertCard(deckId: number, input: CardInput, createdAt: number, dueAt: number): Promise<number | null> {
  try {
    const card = await prisma.card.create({
      data: {
        deckId,
        term: input.term,
        meaning: input.meaning,
        example: input.example,
        notes: input.notes,
        kind: input.kind,
        createdAt: new Date(createdAt),
        progress: { create: { stage: 0, dueAt: new Date(dueAt) } },
      },
      select: { id: true },
    });
    return card.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}

/** Devuelve false si ya existe esa palabra en el mazo, o si el mazo no es del usuario. */
export async function createCard(userId: number, deckId: number, input: CardInput): Promise<boolean> {
  if (!(await userOwnsDeck(userId, deckId))) return false;
  const now = Date.now();
  return (await insertCard(deckId, input, now, now)) !== null;
}

export async function importCards(userId: number, deckId: number, rows: CardInput[]): Promise<{ added: number; skipped: number }> {
  if (!(await userOwnsDeck(userId, deckId))) return { added: 0, skipped: rows.length };
  const now = Date.now();
  return prisma.$transaction(async () => {
    let added = 0;
    for (const [i, row] of rows.entries()) {
      // La lista se muestra de la más nueva a la más vieja: la primera fila importada queda arriba.
      if ((await insertCard(deckId, row, now + (rows.length - i), now)) !== null) added++;
    }
    return { added, skipped: rows.length - added };
  });
}

/** Reparte los rangos del mazo de ejemplo sin modificar cartas ya repasadas. */
export async function seedSampleCardStages(userId: number, deckId: number): Promise<number> {
  if (!(await userOwnsDeck(userId, deckId))) return 0;
  const now = Date.now();
  return prisma.$transaction(async (tx) => {
    const cards = await tx.card.findMany({
      where: { deckId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
    });
    let changed = 0;
    for (const [index, { id }] of cards.entries()) {
      const stage = index % (MAX_STAGE + 1);
      if (stage === 0) continue;
      const dueAt = now + stageInfo(stage).intervalDays * 24 * 60 * 60 * 1000;
      const res = await tx.cardProgress.updateMany({
        where: { cardId: id, stage: 0, reps: 0, lapses: 0, lastReviewedAt: null },
        data: { stage, dueAt: new Date(dueAt), reps: stage, lastReviewedAt: new Date(now) },
      });
      changed += res.count;
    }
    return changed;
  });
}

/** Devuelve false si el nuevo término choca con otra tarjeta del mazo, o si la tarjeta no es del usuario. */
export async function updateCard(userId: number, id: number, input: CardInput): Promise<boolean> {
  if (!(await userOwnsCard(userId, id))) return false;
  try {
    await prisma.card.update({
      where: { id },
      data: { term: input.term, meaning: input.meaning, example: input.example, notes: input.notes, kind: input.kind },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}

export async function deleteCard(userId: number, id: number): Promise<void> {
  if (!(await userOwnsCard(userId, id))) return;
  await prisma.card.delete({ where: { id } });
}

export async function resetCardProgress(userId: number, id: number): Promise<void> {
  if (!(await userOwnsCard(userId, id))) return;
  await prisma.cardProgress.update({
    where: { cardId: id },
    data: { stage: 0, dueAt: new Date(), reps: 0, lapses: 0, lastReviewedAt: null },
  });
}
