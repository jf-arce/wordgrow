import { KindDonutSkeleton } from "./DashboardChartsSkeleton";
import { Skeleton, TextSkeleton } from "./Skeleton";

/** Conserva las dos columnas del panel y representa cada mazo como una fila real. */
export function StudyFocusSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="min-w-0">
        <p className="mb-2 text-sm font-semibold text-ink-soft">Tipos de carta</p>
        <KindDonutSkeleton />
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-sm font-semibold text-ink-soft">Mazos en rotación (últimos 7 días)</p>
        <ul aria-hidden="true" className="flex flex-col gap-1.5">
          {["w-4/5", "w-3/5", "w-2/3"].map((width) => (
            <li key={width} className="flex items-center gap-2">
              <Skeleton className="size-2.5 shrink-0 rounded-full" />
              <TextSkeleton className="min-w-0 flex-1" width={width} />
              <TextSkeleton className="w-20 shrink-0 text-sm" width="w-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
