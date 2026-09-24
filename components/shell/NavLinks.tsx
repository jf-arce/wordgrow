"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, Library, Play, Settings } from "lucide-react";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Estudiar", icon: Play },
  { href: "/mazos", label: "Mazos", icon: Library },
  { href: "/estadisticas", label: "Estadísticas", icon: ChartColumn },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function NavLinks({
  variant,
  pendingCount = 0,
}: {
  variant: "sidebar" | "tabs";
  pendingCount?: number;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    return href === "/" ? pathname === "/" || pathname === "/estudiar" : pathname.startsWith(href);
  };

  return (
    <ul className={clsx(variant === "sidebar" ? "flex flex-col gap-1" : "grid grid-cols-4")}>
      {ITEMS.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = isActive(href);
        const showBadge = href === "/" && pendingCount > 0;

        return (
          <li key={href} className="relative">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 font-semibold transition-colors",
                variant === "sidebar"
                  ? "min-h-11 rounded-full px-4 py-2"
                  : "nav-tab-link min-h-14 flex-col justify-center gap-0.5 rounded-2xl px-1 py-2 text-xs",
                active
                  ? variant === "sidebar"
                    ? "bg-azure-soft text-azure-strong"
                    : "text-azure-strong"
                  : "text-ink-soft hover:text-ink",
                variant === "sidebar" && !active && "hover:bg-paper-2",
              )}
            >
              <span className="nav-tab-icon relative grid place-items-center">
                <Icon size={variant === "sidebar" ? 20 : 22} strokeWidth={active ? 2.5 : 2} aria-hidden />
                {showBadge && (
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1.5 grid min-w-5 place-items-center rounded-full bg-berry px-1.5 text-xs font-bold text-berry-strong-ink"
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </span>
              {label}
              {showBadge && <span className="visually-hidden">, {pendingCount} pendientes hoy</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
