import { Skeleton, TextSkeleton } from "./Skeleton";

/** El gráfico real reserva 112 px, incluidos los 30 px del eje horizontal. */
export function WeekActivitySkeleton() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="text-sm font-semibold text-ink-soft">Repasos por día</p>
      <TextSkeleton className="text-2xl" width="w-2/3" />
      <div aria-hidden="true" className="grid h-28 grid-cols-7 gap-3 px-2">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex min-w-0 flex-col">
            <div className="flex h-[82px] items-end justify-center pb-1">
              <Skeleton className="h-14 w-full max-w-8 rounded-sm" />
            </div>
            <div className="flex h-[30px] items-center justify-center">
              <Skeleton className="h-2 w-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mismos radios y altura que KindDonut; los segmentos neutros no representan datos. */
export function KindDonutSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-8 items-baseline gap-2 text-sm text-ink-soft">
        <TextSkeleton className="w-10 text-2xl" width="w-full" />
        <span>cartas en total</span>
      </div>
      <div aria-hidden="true" className="flex h-52 w-full flex-col items-center">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <svg viewBox="0 0 144 144" className="loading-chart size-36 shrink-0" fill="none">
            {[0, 1, 2].map((segment) => (
              <circle
                key={segment}
                cx="72"
                cy="72"
                r="58"
                stroke="currentColor"
                strokeWidth="28"
                strokeLinecap="round"
                strokeDasharray="84 280.425"
                strokeDashoffset={-segment * 121.475}
                transform="rotate(-90 72 72)"
              />
            ))}
          </svg>
        </div>
        <div className="flex min-h-7 max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 text-xs">
          {["w-10", "w-16", "w-14"].map((width) => (
            <div key={width} className="flex min-w-0 items-center gap-1.5">
              <Skeleton className="size-2 shrink-0 rounded-sm" />
              <TextSkeleton width={width} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
