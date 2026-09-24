import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings2, Upload } from "lucide-react";
import { getDeck } from "@/lib/db/queries/decks";
import { listCards } from "@/lib/db/queries/cards";
import { CARD_KINDS, type CardKind } from "@/lib/quiz";
import { MAX_STAGE } from "@/lib/srs";
import { formatDue } from "@/lib/format";
import { AddCardDialog } from "@/components/forms/AddCardDialog";
import { CardGrid } from "@/components/card/CardGrid";
import { CardFilters } from "@/components/card/CardFilters";
import { StageBar } from "@/components/ui/StageBar";
import { BackLink } from "@/components/ui/BackLink";
import { getCurrentUser, requireUser } from "@/lib/auth/dal";

export async function generateMetadata({ params }: PageProps<"/mazos/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const deck = user && Number.isInteger(Number(id)) ? getDeck(user.id, Number(id)) : null;
  return { title: deck?.name ?? "Mazo" };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DeckPage({ params, searchParams }: PageProps<"/mazos/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const deck = Number.isInteger(Number(id)) ? getDeck(user.id, Number(id)) : null;
  if (!deck) notFound();

  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const stageParam = first(sp.stage);
  const stage =
    stageParam !== undefined && stageParam !== "" && Number(stageParam) >= 0 && Number(stageParam) <= MAX_STAGE
      ? Number(stageParam)
      : undefined;
  const kindParam = first(sp.kind);
  const kind = (CARD_KINDS as readonly string[]).includes(kindParam ?? "") ? (kindParam as CardKind) : undefined;
  const filtered = q !== "" || stage !== undefined || kind !== undefined;

  const cards = listCards(user.id, deck.id, { q: q || undefined, stage, kind });

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/mazos" label="Mazos" className="self-start" />
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-extrabold">{deck.name}</h1>
            {deck.description && <p className="mt-1 max-w-prose text-ink-soft">{deck.description}</p>}
          </div>
          <Link href={`/mazos/${deck.id}/editar`} className="btn btn-quiet btn-small">
            <Settings2 size={16} aria-hidden />
            Editar mazo
          </Link>
        </div>
        <p className="text-ink-soft">
          {deck.total} {deck.total === 1 ? "carta" : "cartas"}
          {deck.due > 0 && <> · {deck.due} para repasar</>}
          {deck.mastered > 0 && <> · {deck.mastered} dominadas</>}
        </p>
        <StageBar stages={deck.stages} />
        <div className="mt-2 flex flex-wrap gap-3">
          <AddCardDialog deckId={deck.id} />
          <Link href={`/mazos/${deck.id}/importar`} className="btn btn-quiet">
            <Upload size={18} aria-hidden />
            Importar lista
          </Link>
        </div>
      </header>

      <section aria-labelledby="cartas-titulo" className="flex flex-col gap-4">
        <h2 id="cartas-titulo" className="text-2xl font-bold">
          Cartas
        </h2>

        {deck.total > 0 && (
          <CardFilters deckId={deck.id} q={q} stage={stage} kind={kind} />
        )}

        {cards.length === 0 ? (
          <p className="surface p-6 text-ink-soft">
            {filtered
              ? "Ninguna carta coincide con ese filtro."
              : "Este mazo está vacío. Agregá tu primera carta arriba o importá una lista."}
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-soft" aria-live="polite">
              {filtered ? `${cards.length} de ${deck.total} cartas` : `${cards.length} cartas`}
            </p>
            <CardGrid
              lang={deck.lang}
              cards={cards.map((c) => ({
                id: c.id,
                term: c.term,
                meaning: c.meaning,
                example: c.example,
                notes: c.notes,
                kind: c.kind,
                stage: c.stage,
                reps: c.reps,
                due: c.due,
                dueLabel: formatDue(c.dueAt, { reps: c.reps }),
              }))}
            />
          </>
        )}
      </section>
    </div>
  );
}
