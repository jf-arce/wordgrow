"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/schemas";
import { auth } from "@/lib/auth/server";
import { requireUser } from "@/lib/auth/dal";
import { done, fail, type ActionResult } from "./result";

export async function saveProfileAction(input: unknown): Promise<ActionResult> {
  await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { firstName, lastName } = parsed.data;

  await auth.api.updateUser({
    body: { firstName, lastName, name: `${firstName} ${lastName}` },
    headers: await headers(),
  });
  revalidatePath("/", "layout");
  return done(undefined);
}
