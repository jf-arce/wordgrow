import Link from "next/link";
import { Plus } from "lucide-react";
import { LoadingFrame, Skeleton, TextSkeleton } from "@/components/loading/Skeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Cargando mazos" className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="text-4xl font-extrabold">Mazos</h1><Link href="/mazos/nuevo" className="btn btn-primary"><Plus size={20} aria-hidden />Nuevo mazo</Link></div>
      <ul className="grid min-w-0 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="deck-showcase flex min-w-0 items-center gap-4 p-4 sm:gap-6 sm:p-5">
            <div className="deck-stack"><Skeleton className="h-full w-full rounded-[0.65rem]" /></div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <TextSkeleton className="w-full text-xl" width="w-5/6" />
              <TextSkeleton className="w-full text-sm" />
              <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
              <Skeleton className="mt-4 h-8 w-24 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>
    </LoadingFrame>
  );
}
