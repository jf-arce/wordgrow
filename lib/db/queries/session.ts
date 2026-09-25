import "server-only";
import { prisma } from "../index";
import { Prisma } from "@/lib/generated/prisma/client";
import { queueSchema, firstsSchema, currentAnswerSchema } from "@/lib/schemas";
import type { QuizItem, StudyMode } from "@/lib/quiz";
import { sessionHref, type StudySource } from "@/lib/study";
import type { Result } from "@/lib/srs";
import { getStudyPrefs } from "./settings";
import { listDecks } from "./decks";
import { nextProgress } from "@/lib/srs";
import { checkTyped } from "@/lib/text";

export type QueueItem = QuizItem & { retry: boolean };
export type FirstAttempt = {
  item: QuizItem;
  result: Result;
  stageAfter: number;
  selectedId?: number;
  typed?: string;
  close?: boolean;
};

export type SessionState = {
  id: number;
  queue: QueueItem[];
  firsts: FirstAttempt[];
  position: number;
  currentAnswer: SessionAnswer | null;
};

export type SessionAnswer = { result: Result; stageAfter: number; selectedId?: number; typed?: string; close?: boolean };
export type AnswerInput = { selectedId?: number; typed?: string; grade?: Result; responseMs: number };

/** CSV de ids ordenados ascendente; '' = todos los mazos. Convención compartida con `lib/db/queries/settings.ts`. */
export function normalizeDeckIds(ids: number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

function toState(row: { id: number; items: Prisma.JsonValue; answers: Prisma.JsonValue; position: number; currentAnswer: Prisma.JsonValue }): SessionState {
  return {
    id: row.id,
    queue: queueSchema.parse(row.items),
    firsts: firstsSchema.parse(row.answers),
    position: row.position,
    currentAnswer: currentAnswerSchema.parse(row.currentAnswer),
  };
}

/** Busca una sesión sin terminar que coincida con esta selección, para retomarla tal cual quedó. */
export async function findActiveSession(
  userId: string,
  opts: { deckIds: number[]; source: StudySource; mode: StudyMode; limit: number },
): Promise<SessionState | null> {
  const row = await prisma.studySession.findFirst({
    where: { userId, finishedAt: null, source: opts.source, mode: opts.mode, limit: opts.limit, deckIds: { equals: normalizeDeckIds(opts.deckIds) } },
    orderBy: { startedAt: "desc" },
    select: { id: true, items: true, answers: true, position: true, currentAnswer: true },
  });
  return row ? toState(row) : null;
}

/** Abre una sesión nueva y devuelve su estado inicial (posición 0, sin respuestas). */
export async function openSession(
  userId: string,
  opts: { deckIds: number[]; source: StudySource; mode: StudyMode; limit: number },
  queue: QueueItem[],
): Promise<SessionState> {
  const session = await prisma.studySession.create({
    data: {
      userId,
      deckIds: normalizeDeckIds(opts.deckIds),
      source: opts.source,
      mode: opts.mode,
      limit: opts.limit,
      items: queue as unknown as Prisma.InputJsonValue,
      answers: [],
    },
    select: { id: true },
  });
  return { id: session.id, queue, firsts: [], position: 0, currentAnswer: null };
}

export async function answerSession(
  userId: string,
  sessionId: number,
  position: number,
  input: AnswerInput,
): Promise<{ answer: SessionAnswer; queue: QueueItem[]; firsts: FirstAttempt[] } | null> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.studySession.findFirst({
      where: { id: sessionId, userId, finishedAt: null },
      select: { items: true, answers: true, position: true, currentAnswer: true },
    });
    if (!row || row.position !== position) return null;
    const queue = queueSchema.parse(row.items);
    const firsts = firstsSchema.parse(row.answers);
    const existingAnswer = currentAnswerSchema.parse(row.currentAnswer);
    if (existingAnswer) return { answer: existingAnswer, queue, firsts };

    const item = queue[position];
    if (!item) return null;
    let result: Result;
    let close = false;
    if (item.mode === "choice" || item.mode === "reverse") {
      if (!item.options?.some((o) => o.id === input.selectedId)) return null;
      result = item.correctOptionId === input.selectedId ? "correct" : "wrong";
    } else if (item.mode === "typed" || item.mode === "cloze") {
      if (typeof input.typed !== "string" || input.typed.length > 300) return null;
      const verdict = checkTyped(input.typed, item.answer);
      result = verdict === "exact" ? "correct" : verdict === "close" ? "unsure" : "wrong";
      close = verdict === "close";
    } else {
      if (!input.grade || !["correct", "unsure", "wrong"].includes(input.grade)) return null;
      result = input.grade;
    }

    const now = Date.now();
    const progress = await tx.cardProgress.findUnique({ where: { cardId: item.cardId }, select: { stage: true, reps: true, lapses: true } });
    if (!progress) return null;
    const next = nextProgress(progress, result, now);
    const answer: SessionAnswer = {
      result,
      stageAfter: item.retry ? progress.stage : next.stage,
      ...(input.selectedId !== undefined ? { selectedId: input.selectedId } : {}),
      ...(input.typed ? { typed: input.typed } : {}),
      ...(close ? { close: true } : {}),
    };

    if (!item.retry) {
      await tx.cardProgress.update({
        where: { cardId: item.cardId },
        data: { stage: next.stage, dueAt: new Date(next.dueAt), reps: next.reps, lapses: next.lapses, lastReviewedAt: new Date(now) },
      });
      await tx.review.create({
        data: { cardId: item.cardId, mode: item.mode, correct: result === "correct", grade: result, responseMs: input.responseMs, reviewedAt: new Date(now) },
      });
      firsts.push({ item, ...answer });
      if (result !== "correct") queue.push({ ...item, retry: true });
    }

    await tx.studySession.update({
      where: { id: sessionId },
      data: {
        items: queue as unknown as Prisma.InputJsonValue,
        answers: firsts as unknown as Prisma.InputJsonValue,
        currentAnswer: answer as unknown as Prisma.InputJsonValue,
      },
    });
    return { answer, queue, firsts };
  });
}

export async function advanceSession(userId: string, sessionId: number, position: number): Promise<{ position: number; finished: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.studySession.findFirst({
      where: { id: sessionId, userId, finishedAt: null },
      select: { items: true, position: true, currentAnswer: true },
    });
    if (!row || row.position !== position || row.currentAnswer === null) return null;
    const finished = position + 1 >= queueSchema.parse(row.items).length;
    await tx.studySession.update({
      where: { id: sessionId },
      data: { position: position + 1, currentAnswer: Prisma.DbNull, finishedAt: finished ? new Date() : null },
    });
    return { position: position + 1, finished };
  });
}

export async function saveSessionProgress(
  userId: string,
  sessionId: number,
  state: { queue: QueueItem[]; firsts: FirstAttempt[]; position: number },
): Promise<void> {
  await prisma.studySession.updateMany({
    where: { id: sessionId, userId, finishedAt: null },
    data: { items: state.queue as unknown as Prisma.InputJsonValue, answers: state.firsts as unknown as Prisma.InputJsonValue, position: state.position },
  });
}

/** Para el CTA "Seguí donde quedaste" en el inicio: la sesión sin terminar más reciente, si hay. */
export async function activeSessionSummary(
  userId: string,
): Promise<{ id: number; deckIds: number[]; source: StudySource; mode: StudyMode; limit: number; answered: number } | null> {
  const row = await prisma.studySession.findFirst({
    where: { userId, finishedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, deckIds: true, source: true, mode: true, limit: true, answers: true },
  });
  if (!row) return null;
  const answered = firstsSchema.parse(row.answers).length;
  return { id: row.id, deckIds: row.deckIds, source: row.source, mode: row.mode, limit: row.limit, answered };
}

export async function finishSession(userId: string, sessionId: number): Promise<void> {
  await prisma.studySession.updateMany({ where: { id: sessionId, userId }, data: { finishedAt: new Date() } });
}

/**
 * A dónde manda el botón de "Estudiar" del inicio: usa la última
 * configuración guardada, y solo cae a la pantalla de configuración si todavía no hay
 * ninguna carta cargada. Centraliza el criterio para que distintos puntos de entrada
 * de la UI no terminen abriendo sesiones distintas entre sí.
 */
export async function resolveStudyHref(userId: string): Promise<string> {
  const decks = await listDecks(userId);
  const hasCards = decks.some((d) => d.total > 0);
  if (!hasCards) return "/estudiar";

  const prefs = await getStudyPrefs(userId);
  return sessionHref(prefs);
}
