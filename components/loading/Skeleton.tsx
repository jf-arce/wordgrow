import { STAGES } from "@/lib/srs";
import type { ReactNode } from "react";
import clsx from "clsx";
import { cn } from "@/lib/utils";

/** Un solo anuncio de carga; las formas decorativas no reciben foco. */
export function LoadingFrame({ children, className, label = "Cargando contenido" }: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={clsx("loading-frame min-w-0", className)}>
      <span role="status" className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("loading-shape max-w-full rounded-md", className)} />;
}

/** Conserva el alto de línea, incluso cuando el texto ocupa varias líneas. */
export function TextSkeleton({ className, width = "w-3/4" }: { className?: string; width?: string }) {
  return <div className={clsx("flex min-h-[1lh] items-center", className)}><Skeleton className={clsx("h-[0.65em]", width)} /></div>;
}

export function ButtonSkeleton({ className = "w-36", large = false }: { className?: string; large?: boolean }) {
  return <Skeleton className={clsx(large ? "h-12" : "h-10", "rounded-lg", className)} />;
}

export function PendingButton({ children, className = "btn-primary" }: {
  children: ReactNode;
  className?: string;
}) {
  return <button type="button" disabled className={clsx("btn self-start", className)}>{children}</button>;
}

export function FieldSkeleton({ label, className, multiline = false, hint }: {
  label: string;
  className?: string;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 font-semibold">{label}</p>
      <Skeleton className={multiline ? "h-20 w-full rounded-[0.55rem]" : "h-11 w-full rounded-[0.55rem]"} />
      {hint && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}

export function ScopeSkeleton() {
  return <div className="grid grid-cols-2 gap-3"><PendingButton className="btn-outline dashboard-deck-choice">Todos los mazos</PendingButton><PendingButton className="btn-outline dashboard-deck-choice">Elegir mazos</PendingButton></div>;
}

export function CollectionSkeleton() {
  return (
    <ul className="collection-ranks">
      {STAGES.map((rank, i) => (
        <li key={i} className={i === 4 ? "collection-rank-slot-featured" : undefined}>
          <div className="surface flex h-[11.5rem] w-full flex-col justify-between p-3">
            <div className="flex flex-1 flex-col items-center justify-center gap-2"><Skeleton className="h-9 w-12" /><span className="text-sm font-semibold text-ink-soft">{rank.plural}</span></div>
            <div className="space-y-2"><Skeleton className="h-2 w-3/4" /><Skeleton className="h-[0.35rem] w-full rounded-full" /></div>
          </div>
        </li>
      ))}
    </ul>
  );
}
