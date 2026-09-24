import { DeckBackLink } from "@/components/loading/DeckBackLink";
import { LoadingFrame } from "@/components/loading/Skeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Cargando importación de cartas" className="flex max-w-3xl flex-col gap-6">
      <DeckBackLink /><h1 className="text-4xl font-extrabold">Importar lista</h1>
      <div className="flex flex-col gap-6">
        <div className="surface p-4 sm:p-5"><p className="font-semibold">¿Qué formato tiene que tener la lista?</p></div>
        <div><label htmlFor="loading-import-text" className="mb-1.5 block font-semibold">Pegá tu lista</label><textarea id="loading-import-text" disabled rows={9} className="field-input font-mono text-sm" placeholder="give up - rendirse" /></div>
        <div><label htmlFor="loading-import-file" className="mb-1.5 block font-semibold">O subí un archivo CSV o de texto</label><input id="loading-import-file" type="file" disabled className="field-input" /></div>
      </div>
    </LoadingFrame>
  );
}
