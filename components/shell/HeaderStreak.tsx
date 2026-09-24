import { Flame } from "lucide-react";
import { todaySummaryCached } from "@/lib/db/queries/stats";
import { requireUser } from "@/lib/auth/dal";

/** Pastilla de racha del header mobile, aparte de `AppLayout` para no bloquear el shell. */
export async function HeaderStreak() {
  const user = await requireUser();
  const { streak } = await todaySummaryCached(user.id);
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-sm font-bold text-gold-ink">
      <Flame size={16} aria-hidden fill={streak > 0 ? "var(--color-gold)" : "none"} />
      {streak}
    </span>
  );
}
