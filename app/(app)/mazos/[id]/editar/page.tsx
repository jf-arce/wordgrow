import { notFound } from "next/navigation";
import { getDeck } from "@/lib/db/queries/decks";
import { DeckForm } from "@/components/forms/DeckForm";
import { DECK_COLORS, type DeckColor } from "@/lib/schemas";
import { BackLink } from "@/components/ui/BackLink";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Editar mazo" };

export default async function EditDeckPage({ params }: PageProps<"/mazos/[id]/editar">) {
  const user = await requireUser();
  const { id } = await params;
  const deck = Number.isInteger(Number(id)) ? await getDeck(user.id, Number(id)) : null;
  if (!deck) notFound();

  return (
    <div className="flex flex-col gap-8">
      <BackLink href={`/mazos/${deck.id}`} label={deck.name} className="self-start" />
      <h1 className="text-4xl font-extrabold">Editar mazo</h1>
      <DeckForm
        deckId={deck.id}
        defaults={{
          name: deck.name,
          description: deck.description,
          lang: deck.lang,
          color: (DECK_COLORS as readonly string[]).includes(deck.color) ? (deck.color as DeckColor) : "leaf",
        }}
      />
    </div>
  );
}
