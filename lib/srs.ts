export const MAX_STAGE = 4;

export type StageInfo = {
  stage: number;
  name: string;
  plural: string;
  /** Días hasta el próximo repaso cuando se acierta en esta etapa. */
  intervalDays: number;
};

/** Rangos de la carta, de novata a experta. Ajustar acá cambia todo el ritmo de repaso. */
export const STAGES: StageInfo[] = [
  { stage: 0, name: "Novato", plural: "Novatos", intervalDays: 0 },
  { stage: 1, name: "Aprendiz", plural: "Aprendices", intervalDays: 1 },
  { stage: 2, name: "Hábil", plural: "Hábiles", intervalDays: 3 },
  { stage: 3, name: "Especialista", plural: "Especialistas", intervalDays: 7 },
  { stage: 4, name: "Experto", plural: "Expertos", intervalDays: 14 },
];

export type Progress = {
  stage: number;
  reps: number;
  lapses: number;
};

export type Result = "correct" | "unsure" | "wrong";

const DAY_MS = 24 * 60 * 60 * 1000;
export const RETRY_DELAY_MS = 10 * 60 * 1000;

export function stageInfo(stage: number): StageInfo {
  return STAGES[Math.min(Math.max(stage, 0), MAX_STAGE)];
}

/**
 * Calcula el nuevo estado de una tarjeta después de responder.
 * - correct: sube una etapa y se agenda según la etapa nueva.
 * - unsure: se queda en la etapa y se repite en la mitad del intervalo actual.
 * - wrong: baja dos etapas (mínimo 1, y nunca sube), suma un lapse y vuelve en 10 minutos.
 */
export function nextProgress(
  progress: Progress,
  result: Result,
  now: number,
): Progress & { dueAt: number } {
  const reps = progress.reps + 1;

  if (result === "wrong") {
    return {
      stage: Math.min(progress.stage, Math.max(1, progress.stage - 2)),
      reps,
      lapses: progress.lapses + 1,
      dueAt: now + RETRY_DELAY_MS,
    };
  }

  if (result === "unsure") {
    const half = (stageInfo(progress.stage).intervalDays * DAY_MS) / 2;
    return {
      stage: progress.stage,
      reps,
      lapses: progress.lapses,
      dueAt: now + Math.max(half, RETRY_DELAY_MS),
    };
  }

  const stage = Math.min(progress.stage + 1, MAX_STAGE);
  return {
    stage,
    reps,
    lapses: progress.lapses,
    dueAt: now + stageInfo(stage).intervalDays * DAY_MS,
  };
}

export function isDue(dueAt: number, now: number): boolean {
  return dueAt <= now;
}

/** "1 novato", "3 aprendices". */
export function stageCount(stage: number, n: number): string {
  const info = stageInfo(stage);
  return `${n} ${(n === 1 ? info.name : info.plural).toLowerCase()}`;
}
