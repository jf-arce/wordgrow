"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { logoutAction } from "@/app/actions/auth";

export function UserMenu({
  firstName,
  lastName,
  email,
  image,
}: {
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:border-azure hover:bg-azure-soft ${open ? "border-azure bg-azure-soft" : "border-base-300 bg-base-100"}`}
      >
        <Avatar firstName={firstName} lastName={lastName} image={image} size={32} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={`${firstName} ${lastName}`}>
          {firstName} {lastName}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-2 w-56 overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-lg">
          <div className="flex items-center gap-3 p-3">
            <Avatar firstName={firstName} lastName={lastName} image={image} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{firstName} {lastName}</p>
              <p className="truncate text-xs text-ink-soft">{email}</p>
            </div>
          </div>
          <div className="border-t border-base-300 py-1">
            <Link href="/perfil" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-200" onClick={() => setOpen(false)}>
              <UserRound size={16} aria-hidden />
              Ver perfil
            </Link>
            <Link href="/ajustes" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-200" onClick={() => setOpen(false)}>
              <Settings size={16} aria-hidden />
              Ajustes
            </Link>
          </div>
          <div className="border-t border-base-300 py-1">
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-berry-ink hover:bg-base-200">
                <LogOut size={16} aria-hidden />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
