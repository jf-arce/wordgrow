import { BackLink } from "@/components/ui/BackLink";
import { PendingButton, CollectionSkeleton, LoadingFrame, Skeleton, TextSkeleton } from "@/components/loading/Skeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Cargando estadísticas" className="flex flex-col gap-10">
      <BackLink href="/" label="Estudiar" className="self-start" />
      <h1 className="text-4xl font-extrabold">Estadísticas</h1>
      <div className="surface grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        {["Racha actual", "Mejor racha", "Repasos totales", "Aciertos"].map(label => <div key={label} className="flex flex-col gap-1 p-4 sm:p-5"><p className="text-sm text-ink-soft">{label}</p><TextSkeleton className="text-3xl" width="w-20" /></div>)}
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Constancia: últimas 12 semanas</h2>
        <div className="surface flex flex-col gap-3 p-5">
          <div className="flex gap-2 overflow-hidden pt-7 pb-1">
            <div className="grid shrink-0 grid-rows-7 gap-1 pr-1 pt-[1.35rem] text-xs text-ink-soft">{["Lun", "", "Mié", "", "Vie", "", ""].map((day, i) => <span key={i} className="flex h-full min-h-[1.1rem] items-center">{day}</span>)}</div>
            <div className="min-w-[22rem] flex-1">
              <TextSkeleton className="mb-1 text-xs" width="w-10" />
              <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
                {Array.from({ length: 84 }, (_, i) => <Skeleton key={i} className="aspect-square min-h-[1.1rem] rounded-[5px]" />)}
              </div>
            </div>
          </div>
          <TextSkeleton className="text-sm" width="w-48" /><TextSkeleton className="text-sm" width="w-28" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Cómo suben de rango tus cartas</h2>
        <CollectionSkeleton />
        <div className="max-w-prose"><TextSkeleton width="w-full" /><TextSkeleton width="w-5/6" /></div>
      </div>
      <div className="flex flex-col gap-4"><h2 className="text-2xl font-bold">Aciertos por mazo</h2><div className="surface flex flex-col justify-center gap-4 p-5" style={{ minHeight: 120 }}>{["w-2/3", "w-1/3", "w-1/2"].map((w, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="h-4 w-20 shrink-0" /><Skeleton className={`h-6 rounded-r-[4px] rounded-l-full ${w}`} /></div>)}</div></div>
      <div className="flex flex-col gap-4"><h2 className="text-2xl font-bold">Las que más te cuestan</h2><div className="surface divide-y divide-line">{Array.from({ length: 3 }, (_, i) => <div key={i} className="flex items-center justify-between gap-4 px-4 py-3"><div className="w-2/3"><TextSkeleton width="w-1/2" /><TextSkeleton className="text-sm" /></div><Skeleton className="h-4 w-20" /></div>)}</div><PendingButton className="btn-primary self-start">Practicar las difíciles</PendingButton></div>
    </LoadingFrame>
  );
}
