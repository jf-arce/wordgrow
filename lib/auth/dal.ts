import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "./server";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
};

/**
 * Capa de acceso a datos: memoizada con `cache()` de React para que, dentro de un mismo
 * render, leer la sesión sólo cueste una consulta aunque varias páginas y acciones la pidan.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user as typeof session.user & { firstName: string; lastName: string };
  return { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, image: u.image ?? null };
});

/** Para Server Components y Server Actions que necesitan sí o sí un usuario logueado. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  return user;
}
