import "server-only";
import { getDb, transaction } from "../index";
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

type Row = {
  id: number;
  items: string;
  answers: string;
  position: number;
  current_answer: string | null;
};

/** CSV de ids ordenados ascendente; '' = todos los mazos. Convención compartida con `lib/db/queries/settings.ts`. */
export function normalizeDeckIds(ids: number[]): string {
  return [...new Set(ids)].sort((a, b) => a - b).join(",");
}

/** Busca una sesión sin terminar que coincida con esta selección, para retomarla tal cual quedó. */
export function findActiveSession(
  userId: number,
  opts: { deckIds: number[]; source: StudySource; mode: StudyMode; limit: number },
): SessionState | null {
  const row = getDb()
    .prepare(
      `SELECT id, items, answers, position, current_answer FROM study_sessions
       WHERE user_id = ? AND finished_at IS NULL
         AND source = ? AND mode = ? AND limit_n = ? AND deck_ids = ?
       ORDER BY started_at DESC LIMIT 1`,
    )
    .get(userId, opts.source, opts.mode, opts.limit, normalizeDeckIds(opts.deckIds)) as Row | undefined;
  if (!row) return null;
  return { id: row.id, queue: JSON.parse(row.items), firsts: JSON.parse(row.answers), position: row.position, currentAnswer: row.current_answer ? JSON.parse(row.current_answer) : null };
}

/** Abre una sesión nueva y devuelve su estado inicial (posición 0, sin respuestas). */
export function openSession(
  userId: number,
  opts: { deckIds: number[]; source: StudySource; mode: StudyMode; limit: number },
  queue: QueueItem[],
): SessionState {
  const now = Date.now();
  const deckIds = normalizeDeckIds(opts.deckIds);
  // deck_id (legacy) queda poblado sólo cuando es un único mazo, para que las lecturas
  // viejas (activeSessionSummary) sigan teniendo sentido sin tocar más columnas.
  const legacyDeckId = opts.deckIds.length === 1 ? opts.deckIds[0] : null;
  const res = getDb()
    .prepare(
      `INSERT INTO study_sessions (user_id, deck_id, deck_ids, source, mode, limit_n, items, answers, position, started_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, '[]', 0, ?, ?)`,
    )
    .run(userId, legacyDeckId, deckIds, opts.source, opts.mode, opts.limit, JSON.stringify(queue), now, now);
  return { id: Number(res.lastInsertRowid), queue, firsts: [], position: 0, currentAnswer: null };
}

export function answerSession(userId: number, sessionId: number, position: number, input: AnswerInput): { answer: SessionAnswer; queue: QueueItem[]; firsts: FirstAttempt[] } | null {
  return transaction((db) => {
    const row = db.prepare("SELECT items, answers, position, current_answer FROM study_sessions WHERE id = ? AND user_id = ? AND finished_at IS NULL").get(sessionId, userId) as Row | undefined;
    if (!row || row.position !== position) return null;
    const queue = JSON.parse(row.items) as QueueItem[];
    const firsts = JSON.parse(row.answers) as FirstAttempt[];
    if (row.current_answer) return { answer: JSON.parse(row.current_answer), queue, firsts };
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
    const progress = db.prepare("SELECT stage, reps, lapses FROM card_progress WHERE card_id = ?").get(item.cardId) as { stage: number; reps: number; lapses: number } | undefined;
    if (!progress) return null;
    const next = nextProgress(progress, result, now);
    const answer: SessionAnswer = { result, stageAfter: item.retry ? progress.stage : next.stage, ...(input.selectedId !== undefined ? { selectedId: input.selectedId } : {}), ...(input.typed ? { typed: input.typed } : {}), ...(close ? { close: true } : {}) };
    if (!item.retry) {
      db.prepare("UPDATE card_progress SET stage = ?, due_at = ?, reps = ?, lapses = ?, last_reviewed_at = ? WHERE card_id = ?").run(next.stage, next.dueAt, next.reps, next.lapses, now, item.cardId);
      db.prepare("INSERT INTO reviews (card_id, mode, correct, grade, response_ms, reviewed_at) VALUES (?, ?, ?, ?, ?, ?)").run(item.cardId, item.mode, result === "correct" ? 1 : 0, result, input.responseMs, now);
      firsts.push({ item, ...answer });
      if (result !== "correct") queue.push({ ...item, retry: true });
    }
    db.prepare("UPDATE study_sessions SET items = ?, answers = ?, current_answer = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(JSON.stringify(queue), JSON.stringify(firsts), JSON.stringify(answer), now, sessionId, userId);
    return { answer, queue, firsts };
  });
}

export function advanceSession(userId: number, sessionId: number, position: number): { position: number; finished: boolean } | null {
  return transaction((db) => {
    const row = db.prepare("SELECT items, position, current_answer FROM study_sessions WHERE id = ? AND user_id = ? AND finished_at IS NULL").get(sessionId, userId) as Row | undefined;
    if (!row || row.position !== position || !row.current_answer) return null;
    const finished = position + 1 >= (JSON.parse(row.items) as QueueItem[]).length;
    db.prepare("UPDATE study_sessions SET position = ?, current_answer = NULL, finished_at = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(position + 1, finished ? Date.now() : null, Date.now(), sessionId, userId);
    return { position: position + 1, finished };
  });
}

export function saveSessionProgress(
  userId: number,
  sessionId: number,
  state: { queue: QueueItem[]; firsts: FirstAttempt[]; position: number },
): void {
  getDb()
    .prepare(
      `UPDATE study_sessions SET items = ?, answers = ?, position = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND finished_at IS NULL`,
    )
    .run(JSON.stringify(state.queue), JSON.stringify(state.firsts), state.position, Date.now(), sessionId, userId);
}

/** Para el CTA "Seguí donde quedaste" en el inicio: la sesión sin terminar más reciente, si hay. */
export function activeSessionSummary(
  userId: number,
): { id: number; deckIds: number[]; source: StudySource; mode: StudyMode; limit: number; answered: number } | null {
  const row = getDb()
    .prepare(
      `SELECT id, deck_ids AS deckIds, source, mode, limit_n AS limitN, answers FROM study_sessions
       WHERE user_id = ? AND finished_at IS NULL ORDER BY updated_at DESC LIMIT 1`,
    )
    .get(userId) as
    | { id: number; deckIds: string; source: StudySource; mode: StudyMode; limitN: number; answers: string }
    | undefined;
  if (!row) return null;
  const answered = (JSON.parse(row.answers) as unknown[]).length;
  const deckIds = row.deckIds ? row.deckIds.split(",").map(Number) : [];
  return { id: row.id, deckIds, source: row.source, mode: row.mode, limit: row.limitN, answered };
}

export function finishSession(userId: number, sessionId: number): void {
  getDb()
    .prepare(`UPDATE study_sessions SET finished_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
    .run(Date.now(), Date.now(), sessionId, userId);
}

/**
 * A dónde manda el botón de "Estudiar" del inicio: usa la última
 * configuración guardada, y solo cae a la pantalla de configuración si todavía no hay
 * ninguna carta cargada. Centraliza el criterio para que distintos puntos de entrada
 * de la UI no terminen abriendo sesiones distintas entre sí.
 */
export function resolveStudyHref(userId: number): string {
  const hasCards = listDecks(userId).some((d) => d.total > 0);
  if (!hasCards) return "/estudiar";

  const prefs = getStudyPrefs(userId);
  return sessionHref(prefs);
}
