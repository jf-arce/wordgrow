import Link from "next/link";
import { buildSession } from "@/lib/db/queries/study";
import type { StudySource } from "@/lib/study";
import { getSettings } from "@/lib/db/queries/settings";
import { findActiveSession, openSession, type QueueItem } from "@/lib/db/queries/session";
import { MODE_LABELS, type StudyMode } from "@/lib/quiz";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { requireUser } from "@/lib/auth/dal";
import { listDecks } from "@/lib/db/queries/decks";

export const metadata = { title: "Sesión de estudio" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SessionPage({ searchParams }: PageProps<"/estudiar/sesion">) {
  const user = await requireUser();
  const sp = await searchParams;
  const source = (["due", "all", "hard", "new"] as const).includes(first(sp.source) as StudySource)
    ? (first(sp.source) as StudySource)
    : "due";
  const mode = Object.keys(MODE_LABELS).includes(first(sp.mode) ?? "") ? (first(sp.mode) as StudyMode) : "mixed";
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(first(sp.limit))) || 20));
  // ?decks=1,3,7 es el formato nuevo; ?deck=N (un solo mazo) se sigue aceptando por
  // compatibilidad con los links viejos que ya existían.
  const decksParam = first(sp.decks);
  const deckParam = first(sp.deck);
  const deckIds = decksParam
    ? decksParam
        .split(",")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)
    : Number.isInteger(Number(deckParam)) && Number(deckParam) > 0
      ? [Number(deckParam)]
      : [];

  const availableIds = new Set((await listDecks(user.id)).map((d) => d.id));
  if (deckIds.some((id) => !availableIds.has(id)) || (decksParam !== undefined && (deckIds.length === 0 || decksParam.split(",").length !== deckIds.length))) {
    return <div className="surface p-6"><h1 className="text-2xl font-bold">Ese mazo ya no está disponible</h1><Link href="/estudiar" className="btn btn-primary mt-4">Revisar configuración</Link></div>;
  }

  const opts = { deckIds, source, mode, limit };
  const exitHref = "/";

  // Si ya había una sesión sin terminar con esta misma selección, se retoma tal cual
  // quedó: salir de la sesión nunca reinicia el progreso del día.
  let session = await findActiveSession(user.id, opts);
  if (!session) {
    const items = await buildSession(user.id, opts);
    if (items.length === 0) {
      const changeHref = deckIds.length === 1 ? `/estudiar?deck=${deckIds[0]}` : "/estudiar";
      return (
        <div className="m-auto flex max-w-md flex-col items-start gap-4 py-16">
          <h1 className="text-3xl font-extrabold">No hay cartas disponibles para {MODE_LABELS[mode].toLowerCase()}</h1>
          <p className="text-ink-soft">
            Probá con otra fuente de cartas (por ejemplo “Todas las cartas”) o agregá más vocabulario al mazo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={changeHref} className="btn btn-primary">
              Cambiar la selección
            </Link>
            <Link href={exitHref} className="btn btn-quiet">
              Volver
            </Link>
          </div>
        </div>
      );
    }
    const queue: QueueItem[] = items.map((i) => ({ ...i, retry: false }));
    session = await openSession(user.id, opts, queue);
  }

  const { autoplayAudio, ttsRate, ttsVoice } = await getSettings(user.id);

  return (
    <QuizRunner
      sessionId={session.id}
      initialQueue={session.queue}
      initialFirsts={session.firsts}
      initialPosition={session.position}
      initialAnswer={session.currentAnswer}
      autoplay={autoplayAudio}
      rate={ttsRate}
      voiceName={ttsVoice}
      exitHref={exitHref}
    />
  );
}
