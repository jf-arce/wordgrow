import "server-only";
import { prisma } from "../index";
import { bestStreak, computeStreak, dayKey } from "@/lib/streak";
import { MAX_STAGE } from "@/lib/srs";
import { CARD_KINDS, type CardKind } from "@/lib/quiz";
import { listDecks } from "./decks";

const DAY_MS = 86_400_000;

type ReviewRow = { reviewedAt: Date; correct: boolean };

async function userReviews(userId: number, since?: Date): Promise<ReviewRow[]> {
  return prisma.review.findMany({
    where: { card: { deck: { userId } }, ...(since ? { reviewedAt: { gte: since } } : {}) },
    select: { reviewedAt: true, correct: true },
  });
}

async function userProgress(userId: number): Promise<{ stage: number; dueAt: Date }[]> {
  return prisma.cardProgress.findMany({
    where: { card: { deck: { userId } } },
    select: { stage: true, dueAt: true },
  });
}

function toDayCounts(reviews: ReviewRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of reviews) {
    const day = dayKey(r.reviewedAt.getTime());
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}

function stageCounts(progress: { stage: number }[]): number[] {
  const stages = Array(MAX_STAGE + 1).fill(0);
  for (const p of progress) stages[p.stage]++;
  return stages;
}

export type TodaySummary = {
  reviewedToday: number;
  streak: number;
  dueNow: number;
  totalCards: number;
  /** Cantidad de tarjetas por etapa 0..MAX_STAGE. */
  stages: number[];
};

export async function todaySummary(userId: number, now = Date.now()): Promise<TodaySummary> {
  const [reviews, progress] = await Promise.all([userReviews(userId), userProgress(userId)]);
  const activeDays = new Set(reviews.map((r) => dayKey(r.reviewedAt.getTime())));
  const today = dayKey(now);
  const stages = stageCounts(progress);

  return {
    reviewedToday: reviews.filter((r) => dayKey(r.reviewedAt.getTime()) === today).length,
    streak: computeStreak(activeDays, now),
    dueNow: progress.filter((p) => p.dueAt.getTime() <= now).length,
    totalCards: stages.reduce((a, b) => a + b, 0),
    stages,
  };
}

export type StatsData = {
  totalReviews: number;
  accuracy: number | null;
  streak: number;
  bestStreak: number;
  heatmap: { day: string; count: number }[];
  decks: { id: number; name: string; color: string; reviews: number; accuracy: number | null }[];
  hard: { id: number; term: string; meaning: string; lapses: number; deck: string }[];
  stages: number[];
};

export const HEATMAP_DAYS = 84;

export async function statsData(userId: number, now = Date.now()): Promise<StatsData> {
  const [reviews, progress, deckRows, hardRows] = await Promise.all([
    userReviews(userId),
    userProgress(userId),
    prisma.deck.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true, cards: { select: { reviews: { select: { correct: true } } } } },
    }),
    prisma.cardProgress.findMany({
      where: { card: { deck: { userId } }, lapses: { gt: 0 } },
      orderBy: [{ lapses: "desc" }, { stage: "asc" }],
      take: 10,
      select: { lapses: true, card: { select: { id: true, term: true, meaning: true, deck: { select: { name: true } } } } },
    }),
  ]);

  const activeDays = new Set(reviews.map((r) => dayKey(r.reviewedAt.getTime())));
  const totalReviews = reviews.length;
  const ok = reviews.filter((r) => r.correct).length;

  const perDay = toDayCounts(reviews.filter((r) => r.reviewedAt.getTime() >= now - HEATMAP_DAYS * DAY_MS));
  const heatmap = Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const day = dayKey(now - (HEATMAP_DAYS - 1 - i) * DAY_MS);
    return { day, count: perDay.get(day) ?? 0 };
  });

  const decks = deckRows.map((d) => {
    const deckReviews = d.cards.flatMap((c) => c.reviews);
    const deckOk = deckReviews.filter((r) => r.correct).length;
    return { id: d.id, name: d.name, color: d.color, reviews: deckReviews.length, accuracy: deckReviews.length > 0 ? deckOk / deckReviews.length : null };
  });

  const hard = hardRows.map((r) => ({ id: r.card.id, term: r.card.term, meaning: r.card.meaning, lapses: r.lapses, deck: r.card.deck.name }));

  return {
    totalReviews,
    accuracy: totalReviews > 0 ? ok / totalReviews : null,
    streak: computeStreak(activeDays, now),
    bestStreak: bestStreak(activeDays),
    heatmap,
    decks,
    hard,
    stages: stageCounts(progress),
  };
}

export type WeekActivity = { day: string; count: number }[];

/** Repasos de cada uno de los últimos 7 días, para la mini-tarjeta del dashboard. */
export async function weekActivity(userId: number, now = Date.now()): Promise<WeekActivity> {
  const reviews = await userReviews(userId, new Date(now - 6 * DAY_MS));
  const perDay = toDayCounts(reviews);
  return Array.from({ length: 7 }, (_, i) => {
    const day = dayKey(now - (6 - i) * DAY_MS);
    return { day, count: perDay.get(day) ?? 0 };
  });
}

export type StudyFocus = {
  /** Cuántas cartas hay de cada tipo, para el tile "Qué estás estudiando". */
  byKind: Record<CardKind, number>;
  /** Mazos con al menos un repaso en los últimos 7 días, con su cantidad de pendientes. */
  activeDecks: { id: number; name: string; color: string; due: number }[];
};

export async function studyFocus(userId: number, now = Date.now()): Promise<StudyFocus> {
  const [kindRows, activeDeckRows, decks] = await Promise.all([
    prisma.card.groupBy({ by: ["kind"], where: { deck: { userId } }, _count: { _all: true } }),
    prisma.review.findMany({
      where: { card: { deck: { userId } }, reviewedAt: { gte: new Date(now - 7 * DAY_MS) } },
      select: { card: { select: { deckId: true } } },
      distinct: ["cardId"],
    }),
    listDecks(userId, now),
  ]);

  const byKind = Object.fromEntries(CARD_KINDS.map((k) => [k, 0])) as Record<CardKind, number>;
  for (const r of kindRows) byKind[r.kind] = r._count._all;

  const activeDeckIds = new Set(activeDeckRows.map((r) => r.card.deckId));
  const activeDecks = decks.filter((d) => activeDeckIds.has(d.id)).map((d) => ({ id: d.id, name: d.name, color: d.color, due: d.due }));

  return { byKind, activeDecks };
}
