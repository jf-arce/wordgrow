import { DECK_COLORS } from "@/lib/schemas";
import { deckColor } from "@/components/ui/DeckColor";
import { DeckBackLink } from "./DeckBackLink";
import { PendingButton, FieldSkeleton, LoadingFrame } from "./Skeleton";

export function DeckFormSkeleton() {
  return (
    <LoadingFrame label="Cargando edición del mazo" className="flex flex-col gap-8">
      <DeckBackLink /><h1 className="text-4xl font-extrabold">Editar mazo</h1>
      <div className="flex max-w-xl flex-col gap-6">
        <FieldSkeleton label="Nombre" />
        <FieldSkeleton label="Descripción (opcional)" multiline hint="Para acordarte de qué trata: clase, libro, tema." />
        <div><p className="mb-1.5 font-semibold">Color</p><div className="flex flex-wrap gap-3">{DECK_COLORS.map(color => <span key={color} aria-hidden="true" className={`size-11 rounded-full ${deckColor(color).dot}`} />)}</div></div>
        <div className="flex flex-wrap items-center gap-3"><PendingButton>Guardar cambios</PendingButton><DeckBackLink cancel /><PendingButton className="btn-danger ml-auto">Borrar mazo</PendingButton></div>
      </div>
    </LoadingFrame>
  );
}
