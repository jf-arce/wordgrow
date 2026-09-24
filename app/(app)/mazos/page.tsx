import Link from "next/link";
import { Plus } from "lucide-react";
import { listDecks } from "@/lib/db/queries/decks";
import { StageBar } from "@/components/ui/StageBar";
import { SampleDeckButton } from "@/components/SampleDeckButton";
import { DeckStack } from "@/components/DeckStack";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Mazos" };

export default async function DecksPage() {
  const user = await requireUser();
  const decks = listDecks(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-extrabold">Mazos</h1>
        <Link href="/mazos/nuevo" className="btn btn-primary">
          <Plus size={20} aria-hidden />
          Nuevo mazo
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="surface flex flex-col items-start gap-4 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Todavía no tenés mazos</h2>
          <p className="max-w-prose text-ink-soft">
            Un mazo es una lista de cartas: palabras o frases, la unidad de una clase, un libro o un tema. Creá uno y
            cargá tu vocabulario, o probá con uno de ejemplo.
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <Link href="/mazos/nuevo" className="btn btn-primary">
              Crear un mazo
            </Link>
            <SampleDeckButton className="btn btn-quiet" />
          </div>
        </div>
      ) : (
        <ul className="grid min-w-0 gap-5 lg:grid-cols-2">
          {decks.map((d) => {
            return (
              <li key={d.id} className="deck-showcase flex min-w-0 items-center gap-4 p-4 sm:gap-6 sm:p-5">
                <DeckStack name={d.name} color={d.color} total={d.total} due={d.due} />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <h2 className="max-w-full text-xl font-bold wrap-anywhere">
                    {d.name}
                  </h2>
                  {d.description && <p className="line-clamp-2 max-w-full wrap-anywhere text-ink-soft">{d.description}</p>}
                  <p className="text-sm text-ink-soft">
                    {d.total} {d.total === 1 ? "carta" : "cartas"}
                    {d.due > 0 && (
                      <>
                        {" "}
                        · <span className="font-semibold text-ink">{d.due} para repasar</span>
                      </>
                    )}
                  </p>
                  <StageBar stages={d.stages} className="mt-3 w-full" />
                  <Link href={`/mazos/${d.id}`} className="btn btn-outline btn-sm mt-4">Ver mazo</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
