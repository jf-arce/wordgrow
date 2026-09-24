"use server";

import { revalidatePath } from "next/cache";
import { answerSession, advanceSession, type AnswerInput } from "@/lib/db/queries/session";
import { requireUser } from "@/lib/auth/dal";
import { done, fail } from "./result";

export async function answerSessionAction(sessionId: number, position: number, input: AnswerInput) {
  const user = await requireUser();
  if (!input || !Number.isInteger(sessionId) || !Number.isInteger(position) || position < 0 || !Number.isInteger(input.responseMs) || input.responseMs < 0 || input.responseMs > 3_600_000) return fail("Respuesta inválida.");
  const result = answerSession(user.id, sessionId, position, input);
  if (!result) return fail("No se pudo guardar la respuesta. Recargá la sesión.");
  revalidatePath("/", "layout");
  return done(result);
}

export async function advanceSessionAction(sessionId: number, position: number) {
  const user = await requireUser();
  const result = advanceSession(user.id, sessionId, position);
  if (!result) return fail("No se pudo avanzar. Recargá la sesión.");
  return done(result);
}
