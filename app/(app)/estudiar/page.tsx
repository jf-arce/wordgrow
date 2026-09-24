import Link from "next/link";
import { listDecks } from "@/lib/db/queries/decks";
import { countSourcesByDeck } from "@/lib/db/queries/study";
import { getStudyPrefs } from "@/lib/db/queries/settings";
import { StudyForm } from "@/components/forms/StudyForm";
import { BackLink } from "@/components/ui/BackLink";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Cómo estudiás" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function StudyConfigPage({ searchParams }: PageProps<"/estudiar">) {
  const user = await requireUser();
  const sp = await searchParams;
  const [decks, countsByDeck, prefs] = await Promise.all([listDecks(user.id), countSourcesByDeck(user.id), getStudyPrefs(user.id)]);

  // ?deck=N precarga el mazo desde su página de detalle.
  const deckParam = Number(first(sp.deck));
  const explicitDeck = decks.find((d) => d.id === deckParam);
  const defaults = explicitDeck ? { ...prefs, deckScope: "selected" as const, deckIds: [explicitDeck.id] } : prefs;
  const selectionNeedsSave = Boolean(
    explicitDeck && (prefs.deckScope !== "selected" || prefs.deckIds.length !== 1 || prefs.deckIds[0] !== explicitDeck.id),
  );

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <BackLink
        href={explicitDeck ? `/mazos/${explicitDeck.id}` : "/"}
        label={explicitDeck ? explicitDeck.name : "Estudiar"}
        className="self-start"
      />
      <div>
        <h1 className="text-4xl font-extrabold">Cómo estudiás</h1>
        <p className="mt-1 max-w-prose text-ink-soft">
          {explicitDeck
            ? `Elegí cómo estudiar ${explicitDeck.name}. Al guardar, esta selección también se usará desde el inicio.`
            : "Esta configuración la usa el botón Estudiar del inicio. Guardala para dejarla lista."}
        </p>
      </div>

      {decks.length === 0 ? (
        <p className="surface p-6 text-ink-soft">
          Primero necesitás cartas para estudiar.{" "}
          <Link href="/mazos/nuevo" className="font-semibold text-azure-strong underline">
            Creá un mazo
          </Link>
          .
        </p>
      ) : (
        <StudyForm decks={decks} countsByDeck={countsByDeck} defaults={defaults} initialDirty={selectionNeedsSave} />
      )}
    </div>
  );
}
