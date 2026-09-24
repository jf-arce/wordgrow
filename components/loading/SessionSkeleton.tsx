import { BackLink } from "@/components/ui/BackLink";
import { ShortcutsHelp } from "@/components/quiz/ShortcutsHelp";
import { PendingButton, LoadingFrame, Skeleton, TextSkeleton } from "./Skeleton";

/** La pregunta y sus opciones reservan el ancho completo del runner. */
export function SessionSkeleton({ mode = "mixed" }: { mode?: string }) {
  const flashcard = mode === "flashcard";
  const typed = mode === "typed" || mode === "cloze";
  return (
    <LoadingFrame label="Cargando sesión de estudio" className="flex w-full flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <BackLink href="/" label="Salir" className="btn-small shrink-0" />
        <div className="order-last mt-1 basis-full sm:order-none sm:mt-0 sm:flex-1 sm:basis-auto"><Skeleton className="mb-1 h-4 w-12" /><Skeleton className="h-3 w-full rounded-full" /></div>
        <div className="hidden sm:block"><ShortcutsHelp /></div>
      </div>
      <div className={`flex flex-1 flex-col gap-6 pt-[2vh] pb-4 sm:pb-8 ${flashcard ? "items-center sm:pt-[4vh]" : "sm:pt-[6vh]"}`}>
        <div className={`surface flex w-full max-w-3xl flex-col gap-3 p-5 sm:p-6 ${flashcard ? "items-center" : ""}`}>
          <TextSkeleton className="w-full text-lg" width="w-3/4" />
          <TextSkeleton className={mode === "cloze" ? "w-full text-3xl leading-snug sm:text-4xl" : "w-full text-5xl leading-[1.05] sm:text-6xl"} width="w-2/3" />
          {mode === "cloze" && <TextSkeleton className="w-full" />}
          {!typed && mode !== "reverse" && <div className="flex gap-2"><Skeleton className="size-11 rounded-full" /><Skeleton className="size-11 rounded-full" /></div>}
        </div>
        {flashcard ? <div className="flex w-full flex-col items-center gap-5"><Skeleton className="aspect-[5/7] w-36 rounded-lg" /><PendingButton className="btn-primary btn-large">Dar vuelta</PendingButton></div> : typed ? <div className="flex flex-col gap-3"><p className="font-semibold">Tu respuesta</p><Skeleton className="h-14 w-full" /><div className="flex gap-3"><PendingButton>Comprobar</PendingButton><PendingButton className="btn-quiet">No sé</PendingButton></div></div> : <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="surface flex min-h-16 items-center gap-3 border-2 px-4 py-3"><Skeleton className="size-8 shrink-0 rounded-full" /><Skeleton className="h-4 w-2/3" /></div>)}</div>}
      </div>
    </LoadingFrame>
  );
}
