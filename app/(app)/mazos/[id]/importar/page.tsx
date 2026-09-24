import { notFound } from "next/navigation";
import { getDeck } from "@/lib/db/queries/decks";
import { existingTerms } from "@/lib/db/queries/cards";
import { ImportForm } from "@/components/forms/ImportForm";
import { BackLink } from "@/components/ui/BackLink";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Importar lista" };

export default async function ImportPage({ params }: PageProps<"/mazos/[id]/importar">) {
  const user = await requireUser();
  const { id } = await params;
  const deck = Number.isInteger(Number(id)) ? await getDeck(user.id, Number(id)) : null;
  if (!deck) notFound();
  const existing = await existingTerms(user.id, deck.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink href={`/mazos/${deck.id}`} label={deck.name} className="self-start" />
      <h1 className="text-4xl font-extrabold">Importar lista</h1>
      <ImportForm deckId={deck.id} existing={existing} />
    </div>
  );
}
