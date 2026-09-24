import { MODES, SOURCE_HINTS, LIMIT_OPTIONS } from "@/lib/study-options";
import { SOURCE_LABELS } from "@/lib/study";
import { MODE_LABELS } from "@/lib/quiz";
import { StudyBackLink } from "@/components/loading/StudyBackLink";
import { PendingButton, LoadingFrame, ScopeSkeleton, Skeleton } from "@/components/loading/Skeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Cargando configuración de estudio" className="flex max-w-3xl flex-col gap-8">
      <StudyBackLink />
      <div><h1 className="text-4xl font-extrabold">Cómo estudiás</h1><p className="mt-1 max-w-prose text-ink-soft">Esta configuración la usa el botón Estudiar del inicio. Se guarda sola apenas la cambiás.</p></div>
      <div className="flex flex-col gap-8">
        <ScopeSkeleton />
        <div><p className="mb-2 font-semibold">Qué cartas</p><div className="grid gap-2">{Object.entries(SOURCE_LABELS).map(([source, label]) => <OptionSkeleton key={source} label={label} hint={Object.entries(SOURCE_HINTS).find(([key]) => key === source)?.[1]} count />)}</div></div>
        <div><p className="mb-2 font-semibold">Modo</p><div className="grid gap-2 sm:grid-cols-2">{MODES.map(mode => <OptionSkeleton key={mode.value} label={MODE_LABELS[mode.value]} hint={mode.hint} />)}</div></div>
        <div><p className="mb-2 font-semibold">Cantidad de preguntas</p><div className="flex gap-2">{LIMIT_OPTIONS.map(limit => <PendingButton key={limit} className="btn-outline btn-sm">{limit}</PendingButton>)}</div></div>
        <PendingButton className="btn-quiet self-start">Restablecer</PendingButton>
      </div>
    </LoadingFrame>
  );
}

function OptionSkeleton({ label, hint, count = false }: { label: string; hint?: string; count?: boolean }) {
  return (
    <div className="surface flex items-start gap-3 p-4">
      <Skeleton className="mt-1.5 size-4 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><span className="font-semibold">{label}</span>{count && <Skeleton className="h-4 w-6" />}</div>
        <span className="text-sm text-ink-soft">{hint}</span>
      </div>
    </div>
  );
}
