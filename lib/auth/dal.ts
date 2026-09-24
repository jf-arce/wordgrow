import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";
import { getUserById, type User } from "@/lib/db/queries/auth";

/**
 * Capa de acceso a datos: memoizada con `cache()` de React para que, dentro de un mismo
 * render, leer la sesión sólo cueste una consulta aunque varias páginas y acciones la pidan.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const userId = await readSession();
  if (!userId) return null;
  return getUserById(userId);
});

/** Para Server Components y Server Actions que necesitan sí o sí un usuario logueado. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  return user;
}
