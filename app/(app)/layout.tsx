import { Flame, LogOut } from "lucide-react";
import { NavLinks } from "@/components/shell/NavLinks";
import { Wordmark } from "@/components/shell/Wordmark";
import { GoalRing } from "@/components/GoalRing";
import { getSettings, getReminderPrefs } from "@/lib/db/queries/settings";
import { todaySummary } from "@/lib/db/queries/stats";
import { requireUser } from "@/lib/auth/dal";
import { logoutAction } from "@/app/actions/auth";
import { ReminderTimer } from "@/components/pwa/ReminderTimer";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [today, { dailyGoal }, reminderPrefs] = await Promise.all([todaySummary(user.id), getSettings(user.id), getReminderPrefs(user.id)]);

  return (
    <div className="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <ReminderTimer prefs={reminderPrefs} />
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line px-5 py-7 lg:flex">
        <Wordmark />
        <nav aria-label="Principal" className="flex-1">
          <NavLinks variant="sidebar" pendingCount={today.dueNow} />
        </nav>
        <div className="flex flex-col gap-4 border-t border-line pt-5">
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
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between px-4 pt-5 lg:hidden">
          <Wordmark />
          <span className="flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-sm font-bold text-gold-ink">
            <Flame size={16} aria-hidden fill={today.streak > 0 ? "var(--color-gold)" : "none"} />
            {today.streak}
          </span>
        </header>
        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-4xl px-4 py-8 pb-32 outline-none sm:px-8 lg:py-12 lg:pb-16"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur lg:hidden"
      >
        <NavLinks variant="tabs" pendingCount={today.dueNow} />
      </nav>
    </div>
  );
}
