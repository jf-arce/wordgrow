import { StudyFocusSkeleton } from "./StudyFocusSkeleton";
import { WeekActivitySkeleton } from "./DashboardChartsSkeleton";
import Link from "next/link";
import { ButtonSkeleton, CollectionSkeleton, LoadingFrame, ScopeSkeleton, TextSkeleton } from "./Skeleton";

export function DashboardSkeleton() {
  return (
    <LoadingFrame label="Cargando tu estudio" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <div className="surface col-span-2 row-span-2 flex flex-col justify-center gap-6 p-5 sm:p-8 md:col-span-3 md:row-span-1 lg:col-span-2 lg:row-span-2">
        <div className="text-3xl leading-[1.05] sm:text-4xl"><TextSkeleton width="w-11/12" /><TextSkeleton width="w-3/4" /></div>
        <div className="flex flex-wrap items-center gap-3"><ButtonSkeleton large className="w-36" /><Link href="/estudiar" className="btn btn-outline btn-lg">Cómo estudiás</Link></div>
      </div>
      <div className="surface col-span-2 p-5 md:col-span-3 lg:col-span-2">
        <WeekActivitySkeleton />
      </div>
      <div className="surface col-span-2 flex flex-col gap-4 p-5 sm:p-6 md:col-span-3 lg:col-span-2">
        <h2 className="text-xl font-bold">Mazos para estudiar</h2>
        <ScopeSkeleton />
      </div>
      <div className="surface col-span-2 p-5 sm:p-6 md:col-span-3 lg:col-span-4">
        <h2 className="mb-4 text-xl font-bold">Qué estás estudiando</h2>
        <StudyFocusSkeleton />
      </div>
      <div className="surface col-span-2 p-5 sm:p-6 md:col-span-3 lg:col-span-4">
        <h2 className="mb-4 text-xl font-bold">Tu colección</h2>
        <CollectionSkeleton />
      </div>
    </LoadingFrame>
  );
}
