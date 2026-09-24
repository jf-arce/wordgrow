import { BackLink } from "@/components/ui/BackLink";
import { PendingButton, LoadingFrame, Skeleton, TextSkeleton } from "@/components/loading/Skeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Cargando mazo y cartas" className="flex flex-col gap-8">
      <BackLink href="/mazos" label="Mazos" className="self-start" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4"><TextSkeleton className="w-72 text-4xl" /><PendingButton className="btn-quiet btn-small">Editar mazo</PendingButton></div>
        <TextSkeleton width="w-56" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="mt-2 flex flex-wrap gap-3"><PendingButton>Agregar carta</PendingButton><PendingButton className="btn-quiet">Importar lista</PendingButton></div>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Cartas</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1"><p className="mb-1.5 text-sm font-semibold">Buscar</p><Skeleton className="h-11 w-full" /></div>
          <div><p className="mb-1.5 text-sm font-semibold">Etapa</p><Skeleton className="h-11 w-36" /></div>
          <div><p className="mb-1.5 text-sm font-semibold">Tipo</p><Skeleton className="h-11 w-40" /></div>
        </div>
        <TextSkeleton className="text-sm" width="w-20" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`surface aspect-[5/7] w-full max-w-56 flex-col gap-2 p-2 ${i < 4 ? "flex" : i < 6 ? "hidden sm:flex" : i < 8 ? "hidden lg:flex" : "hidden xl:flex"}`}>
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="min-h-0 w-full flex-1" />
              <Skeleton className="h-5 w-4/5" />
              <div className="flex justify-between border-t border-line pt-1"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-5" /></div>
            </div>
          ))}
        </div>
      </div>
    </LoadingFrame>
  );
}
