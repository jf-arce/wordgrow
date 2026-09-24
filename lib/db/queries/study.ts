import "server-only";
import { prisma } from "../index";
import { buildItem, canBuildItem, type CardKind, type QuizCard, type QuizItem, type StudyMode } from "@/lib/quiz";
import { shuffle } from "@/lib/text";
import { nextProgress, type Result } from "@/lib/srs";
import type { QuizMode } from "@/lib/quiz";
import { SOURCE_LABELS, type StudySource } from "@/lib/study";
import { userOwnsCard } from "./decks";

export { SOURCE_LABELS, type StudySource };

type Row = {
  id: number;
  deckId: number;
  term: string;
  meaning: string;
  example: string;
  kind: CardKind;
  stage: number;
  lang: string;
  dueAt: number;
  lapses: number;
  reps: number;
};

async function loadRows(userId: number): Promise<Row[]> {
  const cards = await prisma.card.findMany({
    where: { deck: { userId } },
    select: {
      id: true,
      deckId: true,
      term: true,
      meaning: true,
      example: true,
      kind: true,
      deck: { select: { lang: true } },
      progress: { select: { stage: true, dueAt: true, lapses: true, reps: true } },
    },
  });
  return cards
    .filter((c) => c.progress !== null)
    .map((c) => ({
      id: c.id,
      deckId: c.deckId,
      term: c.term,
      meaning: c.meaning,
      example: c.example,
      kind: c.kind,
      stage: c.progress!.stage,
      lang: c.deck.lang,
      dueAt: c.progress!.dueAt.getTime(),
      lapses: c.progress!.lapses,
      reps: c.progress!.reps,
    }));
}

function toQuizCard(r: Row): QuizCard {
  return {
    id: r.id,
    deckId: r.deckId,
    term: r.term,
    meaning: r.meaning,
    example: r.example,
    kind: r.kind,
    stage: r.stage,
    lang: r.lang,
  };
}

export type SessionOptions = {
  /** Vacío = todos los mazos. */
  deckIds: number[];
  source: StudySource;
  mode: StudyMode;
  limit: number;
};

/** Cuántas tarjetas hay disponibles para cada fuente (para la pantalla de configuración). */
export async function countSources(userId: number, deckIds: number[] = [], now = Date.now()): Promise<Record<StudySource, number>> {
  const rows = await loadRows(userId);
  const scoped = deckIds.length ? rows.filter((r) => deckIds.includes(r.deckId)) : rows;
  return {
    due: scoped.filter((r) => r.dueAt <= now).length,
    all: scoped.length,
    hard: scoped.filter((r) => r.lapses > 0 || (r.reps > 0 && r.stage <= 2)).length,
    new: scoped.filter((r) => r.reps === 0).length,
  };
}

/** Igual que `countSources`, pero desglosado por mazo: para que el selector de mazos
 * muestre conteos por fuente sin un round-trip al servidor por cada click. */
export async function countSourcesByDeck(userId: number, now = Date.now()): Promise<Record<number, Record<StudySource, number>>> {
  const rows = await loadRows(userId);
  const out: Record<number, Record<StudySource, number>> = {};
  for (const r of rows) {
    const c = (out[r.deckId] ??= { due: 0, all: 0, hard: 0, new: 0 });
    c.all += 1;
    if (r.dueAt <= now) c.due += 1;
    if (r.reps === 0) c.new += 1;
    if (r.lapses > 0 || (r.reps > 0 && r.stage <= 2)) c.hard += 1;
  }
  return out;
}

export async function buildSession(userId: number, options: SessionOptions, now = Date.now()): Promise<QuizItem[]> {
  const all = await loadRows(userId);
  const scoped = options.deckIds.length ? all.filter((r) => options.deckIds.includes(r.deckId)) : all;

  let picked: Row[];
  switch (options.source) {
    case "due":
      picked = scoped.filter((r) => r.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
      break;
    case "new":
      picked = shuffle(scoped.filter((r) => r.reps === 0));
      break;
    case "hard":
      picked = scoped
        .filter((r) => r.lapses > 0 || (r.reps > 0 && r.stage <= 2))
        .sort((a, b) => b.lapses - a.lapses || a.stage - b.stage);
      break;
    default:
      picked = shuffle(scoped);
  }

  const pool = scoped.map(toQuizCard);
  const compatible = options.mode === "mixed" ? picked : picked.filter((r) => canBuildItem(toQuizCard(r), pool, options.mode));
  return shuffle(compatible.slice(0, options.limit)).map((r) => buildItem(toQuizCard(r), pool, options.mode));
}

export async function recordReview(
  userId: number,
  input: { cardId: number; mode: QuizMode; result: Result; responseMs: number },
): Promise<{ stage: number; dueAt: number } | null> {
  if (!(await userOwnsCard(userId, input.cardId))) return null;
  const now = Date.now();
  return prisma.$transaction(async (tx) => {
    const current = await tx.cardProgress.findUnique({
      where: { cardId: input.cardId },
      select: { stage: true, reps: true, lapses: true },
    });
    if (!current) return null;

    const next = nextProgress(current, input.result, now);
    await tx.cardProgress.update({
      where: { cardId: input.cardId },
      data: { stage: next.stage, dueAt: new Date(next.dueAt), reps: next.reps, lapses: next.lapses, lastReviewedAt: new Date(now) },
    });

    await tx.review.create({
      data: {
        cardId: input.cardId,
        mode: input.mode,
        correct: input.result === "correct",
        grade: input.result,
        responseMs: input.responseMs,
        reviewedAt: new Date(now),
      },
    });

    return { stage: next.stage, dueAt: next.dueAt };
  });
}
