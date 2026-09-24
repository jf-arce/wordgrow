import { requireUser } from "@/lib/auth/dal";
import { todaySummaryCached } from "@/lib/db/queries/stats";
import { NavLinks } from "./NavLinks";

/** Envoltorio async de `NavLinks`: separado para poder mostrar el menú al toque (sin
 * el badge de pendientes) mientras se resuelve la cantidad, en vez de bloquear todo
 * el shell de `AppLayout` hasta tener el dato. */
export async function NavBadge({ variant }: { variant: "sidebar" | "tabs" }) {
  const user = await requireUser();
  const { dueNow } = await todaySummaryCached(user.id);
  return <NavLinks variant={variant} pendingCount={dueNow} />;
}
