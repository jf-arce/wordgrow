import { Flame, LogOut } from "lucide-react";
import { GoalRing } from "@/components/GoalRing";
import { getSettings } from "@/lib/db/queries/settings";
import { todaySummaryCached } from "@/lib/db/queries/stats";
import { requireUser } from "@/lib/auth/dal";
import { logoutAction } from "@/app/actions/auth";

/** Racha + meta del día + usuario/logout del sidebar. Aparte de `AppLayout` para que el
 * shell (Wordmark, nav) no espere a esta consulta antes de mostrarse. */
export async function SidebarFooter() {
  const user = await requireUser();
  const [today, { dailyGoal }] = await Promise.all([todaySummaryCached(user.id), getSettings(user.id)]);

  return (
    <>
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <Flame size={18} aria-hidden fill={today.streak > 0 ? "var(--color-gold)" : "none"} className="text-gold-ink" />
        {today.streak === 0 ? "Sin racha" : `${today.streak} ${today.streak === 1 ? "día" : "días"} seguidos`}
      </div>
      <GoalRing value={today.reviewedToday} goal={dailyGoal} />
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold" title={`${user.firstName} ${user.lastName}`}>
          {user.firstName}
        </p>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-quiet btn-small" aria-label="Cerrar sesión">
            <LogOut size={14} aria-hidden />
            Salir
          </button>
        </form>
      </div>
    </>
  );
}

/** Mismo esqueleto de tres bloques mientras se resuelve `SidebarFooter`. */
export function SidebarFooterSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="skeleton h-5 w-32" />
      <div className="skeleton size-20 rounded-full" />
      <div className="flex items-center justify-between gap-2">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}
