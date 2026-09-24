"use server";

import { revalidatePath } from "next/cache";
import { reviewSchema } from "@/lib/schemas";
import { recordReview } from "@/lib/db/queries/study";
import { requireUser } from "@/lib/auth/dal";
import { done, fail, type ActionResult } from "./result";

export async function recordReviewAction(input: unknown): Promise<ActionResult<{ stage: number }>> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail("Respuesta inválida.");
  const res = await recordReview(user.id, parsed.data);
  if (!res) return fail("Esa tarjeta ya no existe.");
  revalidatePath("/", "layout");
  return done({ stage: res.stage });
}
