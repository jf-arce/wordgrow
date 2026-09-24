import Link from "next/link";
import { Play, TriangleAlert } from "lucide-react";
import { listDecks } from "@/lib/db/queries/decks";
import { getStudyPrefs, getReminderPrefs } from "@/lib/db/queries/settings";
import { todaySummaryCached, studyFocus, weekActivity } from "@/lib/db/queries/stats";
import { countSourcesByDeck } from "@/lib/db/queries/study";
import { activeSessionSummary, resolveStudyHref } from "@/lib/db/queries/session";
import { sessionHref } from "@/lib/study";
import { isDueNow } from "@/lib/reminders";
import { Collection } from "@/components/collection/Collection";
import { SampleDeckButton } from "@/components/SampleDeckButton";
import { StudyShortcut } from "@/components/dashboard/StudyShortcut";
import { StudyFocusPanel } from "@/components/dashboard/StudyFocusPanel";
import { WeekActivityPanel } from "@/components/dashboard/WeekActivityPanel";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Estudiar" };

export default async function TodayPage() {
  const user = await requireUser();
  const [today, prefs, decks, countsByDeck, focus, week, active, studyHref, reminderPrefs] = await Promise.all([
    todaySummaryCached(user.id),
    getStudyPrefs(user.id),
    listDecks(user.id),
    countSourcesByDeck(user.id),
    studyFocus(user.id),
    weekActivity(user.id),
    activeSessionSummary(user.id),
    resolveStudyHref(user.id),
    getReminderPrefs(user.id),
  ]);
  const selectedIds = prefs.deckScope === "selected" ? prefs.deckIds : decks.map((d) => d.id);
  const available = selectedIds.reduce((total, id) => total + (countsByDeck[id]?.[prefs.source] ?? 0), 0);
  const empty = decks.length === 0;
  const resumeHref = active ? sessionHref(active) : null;

  const now = new Date();
  const notReviewedToday = !empty && today.reviewedToday === 0;
  const remindToday = notReviewedToday && isDueNow(reminderPrefs, now);
  const streakAtRisk = notReviewedToday && today.streak > 0 && 24 - now.getHours() <= 4;

  return (
    <div className="flex flex-col gap-4">
      {resumeHref && active && (
        <div role="alert" className="alert flex-wrap justify-between">
          <span className="font-semibold">
            Tenés una sesión a medias: respondiste {active.answered} de {active.limit}.
          </span>
          <Link href={resumeHref} className="btn btn-primary btn-sm" aria-label="Seguir donde quedaste">
            <Play size={16} aria-hidden fill="currentColor" />
            Seguir
          </Link>
        </div>
      )}
      {(streakAtRisk || remindToday) && (
        <div role="alert" className={`alert ${streakAtRisk ? "alert-error" : "alert-info"}`}>
          {streakAtRisk ? (
            <>
              <TriangleAlert size={20} aria-hidden className="shrink-0" />
              <span className="font-semibold">
                Tu racha de {today.streak} {today.streak === 1 ? "día" : "días"} está por cortarse: quedan pocas
                horas para repasar hoy.
              </span>
            </>
          ) : (
            <span className="font-semibold">Hoy es de tus días de práctica. Sumale unos minutos.</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Hero: estado del día + CTA principal. En tablet ocupa el ancho completo (una sola
            fila) en vez de mantener la altura doble pensada para al lado de Racha/Meta. */}
        <section
          aria-labelledby="hoy-titulo"
          className="surface col-span-2 row-span-2 flex flex-col justify-center gap-6 p-5 sm:p-8 md:col-span-3 md:row-span-1 lg:col-span-2 lg:row-span-2"
        >
          {empty ? (
            <>
              <h1 id="hoy-titulo" className="max-w-xl text-3xl font-extrabold leading-[1.05] sm:text-4xl">
                Armá tu primer mazo de cartas
              </h1>
              <p className="max-w-prose text-ink-soft">
                Creá un mazo con el vocabulario de tu clase (palabras, frases, phrasal verbs). WordGrow te las
                pregunta y te las vuelve a traer justo antes de que las olvides.
              </p>
              <div className="flex flex-wrap items-start gap-3">
                <Link href="/mazos/nuevo" className="btn btn-primary btn-lg">
                  Crear mi primer mazo
                </Link>
                <SampleDeckButton />
              </div>
            </>
          ) : available > 0 ? (
            <>
              <h1 id="hoy-titulo" className="max-w-2xl text-3xl font-extrabold leading-[1.05] sm:text-4xl">
                {prefs.source === "due" ? `Tenés ${available} ${available === 1 ? "carta" : "cartas"} para repasar` : `Tenés ${available} ${available === 1 ? "carta" : "cartas"} en tu selección`}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={studyHref} className="btn btn-primary btn-lg">
                  <Play size={20} aria-hidden fill="currentColor" />
                  Estudiar
                </Link>
                <Link href="/estudiar" className="btn btn-outline btn-lg">
                  Cómo estudiás
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 id="hoy-titulo" className="max-w-2xl text-3xl font-extrabold leading-[1.05] sm:text-4xl">
                No hay cartas disponibles con tu selección
              </h1>
              <p className="max-w-prose text-ink-soft">Cambiá qué cartas querés estudiar o sumá cartas nuevas a un mazo.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/estudiar" className="btn btn-primary btn-lg">
                  Revisar qué estudiar
                </Link>
                <Link href="/mazos" className="btn btn-outline btn-lg">
                  Agregar cartas
                </Link>
              </div>
            </>
          )}
        </section>

        {!empty && (
          <>
            {/* Actividad de la semana. La racha ya se ve en el sidebar/header (GoalRing
                en AppLayout) — repetirla acá era redundante. */}
            <section
              aria-label="Actividad de la semana"
              className="surface col-span-2 p-5 md:col-span-3 lg:col-span-2"
            >
              <WeekActivityPanel week={week} />
            </section>

            {/* Selector rápido de mazos para la próxima sesión. */}
            <section
              aria-labelledby="estudiar-hoy-titulo"
              className="surface col-span-2 flex flex-col gap-4 p-5 sm:p-6 md:col-span-3 lg:col-span-2"
            >
              <h2 id="estudiar-hoy-titulo" className="text-xl font-bold">
                Mazos para estudiar
              </h2>
              <StudyShortcut
                decks={decks}
                countsByDeck={countsByDeck}
                savedDeckIds={prefs.deckIds}
                savedDeckScope={prefs.deckScope}
                savedSource={prefs.source}
                savedMode={prefs.mode}
                savedLimit={prefs.limit}
              />
            </section>

            {/* Qué estás estudiando. */}
            <section aria-labelledby="foco-titulo" className="surface col-span-2 p-5 sm:p-6 md:col-span-3 lg:col-span-4">
              <h2 id="foco-titulo" className="mb-4 text-xl font-bold">
                Qué estás estudiando
              </h2>
              <StudyFocusPanel focus={focus} />
            </section>

            {/* Tu colección. */}
            <section aria-labelledby="coleccion-titulo" className="surface col-span-2 p-5 sm:p-6 md:col-span-3 lg:col-span-4">
              <h2 id="coleccion-titulo" className="mb-4 text-xl font-bold">
                Tu colección
              </h2>
              <Collection stages={today.stages} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
