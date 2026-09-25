import "server-only";
import { prisma } from "../index";
import type { DeckInput } from "@/lib/schemas";
import { MAX_STAGE } from "@/lib/srs";

export type DeckSummary = {
  id: number;
  name: string;
  description: string;
  color: string;
  lang: string;
  total: number;
  due: number;
  mastered: number;
  /** Cantidad de tarjetas por etapa 0..MAX_STAGE. */
  stages: number[];
};

export async function listDecks(userId: string, now = Date.now()): Promise<DeckSummary[]> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      lang: true,
      cards: { select: { progress: { select: { stage: true, dueAt: true } } } },
    },
  });

  return decks.map((d) => {
    const stages = Array(MAX_STAGE + 1).fill(0);
    let due = 0;
    let mastered = 0;
    for (const card of d.cards) {
      if (!card.progress) continue;
      stages[card.progress.stage]++;
      if (card.progress.dueAt.getTime() <= now) due++;
      if (card.progress.stage === MAX_STAGE) mastered++;
    }
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      color: d.color,
      lang: d.lang,
      total: d.cards.length,
      due,
      mastered,
      stages,
    };
  });
}

export async function getDeck(userId: string, id: number): Promise<DeckSummary | null> {
  const decks = await listDecks(userId);
  return decks.find((d) => d.id === id) ?? null;
}

/** Verifica que el mazo exista y sea del usuario, para no dejar tocar tarjetas ajenas por id. */
export async function userOwnsDeck(userId: string, deckId: number): Promise<boolean> {
  const count = await prisma.deck.count({ where: { id: deckId, userId } });
  return count > 0;
}

/** Igual que `userOwnsDeck`, pero a partir del id de una tarjeta (para acciones sobre cartas sueltas). */
export async function userOwnsCard(userId: string, cardId: number): Promise<boolean> {
  const count = await prisma.card.count({ where: { id: cardId, deck: { userId } } });
  return count > 0;
}

export async function createDeck(userId: string, input: DeckInput): Promise<number> {
  const deck = await prisma.deck.create({
    data: { userId, name: input.name, description: input.description, color: input.color, lang: input.lang },
    select: { id: true },
  });
  return deck.id;
}

export async function updateDeck(userId: string, id: number, input: DeckInput): Promise<void> {
  await prisma.deck.updateMany({
    where: { id, userId },
    data: { name: input.name, description: input.description, color: input.color, lang: input.lang },
  });
}

export async function deleteDeck(userId: string, id: number): Promise<void> {
  await prisma.deck.deleteMany({ where: { id, userId } });
}
