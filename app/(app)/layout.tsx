import { Suspense } from "react";
import { NavLinks } from "@/components/shell/NavLinks";
import { NavBadge } from "@/components/shell/NavBadge";
import { Wordmark } from "@/components/shell/Wordmark";
import { SidebarFooter, SidebarFooterSkeleton } from "@/components/shell/SidebarFooter";
import { HeaderStreak } from "@/components/shell/HeaderStreak";
import { ReminderTimerLoader } from "@/components/pwa/ReminderTimerLoader";

/**
 * El shell (Wordmark, nav, `<main>`) se pinta enseguida, sin esperar a la base de
 * datos: cada bloque que sí depende de datos del usuario (racha/meta/nombre del
 * sidebar, la pastilla de racha del header mobile, el badge de pendientes del nav)
 * vive en su propio Server Component async detrás de un `<Suspense>`. `requireUser()`
 * corre dentro de cada uno de esos (memoizado con `cache()`, así que no repite la
 * consulta de sesión) y en cada page — acá ya no bloquea el layout entero.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <Suspense fallback={null}>
        <ReminderTimerLoader />
      </Suspense>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line px-5 py-7 lg:flex">
        <Wordmark />
        <nav aria-label="Principal" className="flex-1">
          <Suspense fallback={<NavLinks variant="sidebar" />}>
            <NavBadge variant="sidebar" />
          </Suspense>
        </nav>
        <div className="flex flex-col gap-4 border-t border-line pt-5">
          <Suspense fallback={<SidebarFooterSkeleton />}>
            <SidebarFooter />
          </Suspense>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between px-4 pt-5 lg:hidden">
          <Wordmark />
          <Suspense fallback={<span aria-hidden className="skeleton h-8 w-14 rounded-full" />}>
            <HeaderStreak />
          </Suspense>
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
        <Suspense fallback={<NavLinks variant="tabs" />}>
          <NavBadge variant="tabs" />
        </Suspense>
      </nav>
    </div>
  );
}
