import { Wordmark } from "@/components/shell/Wordmark";
import { LoadingFrame, Skeleton, TextSkeleton } from "@/components/loading/Skeleton";

/** Respaldo entre grupos; cada pantalla tiene su propia estructura de carga. */
export default function Loading() {
  return (
    <LoadingFrame label="Cargando WordGrow" className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6">
      <Wordmark />
      <div className="surface flex flex-col gap-6 p-5 sm:p-6"><TextSkeleton className="text-3xl" /><TextSkeleton /><Skeleton className="h-11 w-40 rounded-lg" /></div>
    </LoadingFrame>
  );
}
