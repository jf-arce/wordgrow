import Link from "next/link";
import { statsData } from "@/lib/db/queries/stats";
import { STAGES } from "@/lib/srs";
import { Heatmap } from "@/components/stats/Heatmap";
import { AccuracyBars } from "@/components/stats/AccuracyBars";
import { Collection } from "@/components/collection/Collection";
import { BackLink } from "@/components/ui/BackLink";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Estadísticas" };

export default async function StatsPage() {
  const user = await requireUser();
  const s = await statsData(user.id);
  const empty = s.totalReviews === 0;
  const pct = s.accuracy === null ? "–" : `${Math.round(s.accuracy * 100)}%`;
  const facts = [
    { label: "Racha actual", value: `${s.streak} ${s.streak === 1 ? "día" : "días"}` },
    { label: "Mejor racha", value: `${s.bestStreak} ${s.bestStreak === 1 ? "día" : "días"}` },
    { label: "Repasos totales", value: String(s.totalReviews) },
    { label: "Aciertos", value: pct },
  ];

  return (
    <div className="flex flex-col gap-10">
      <BackLink href="/" label="Estudiar" className="self-start" />
      <h1 className="text-4xl font-extrabold">Estadísticas</h1>

      <dl className="surface grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1 p-4 sm:p-5">
            <dt className="text-sm text-ink-soft">{f.label}</dt>
            <dd className="font-display text-3xl font-extrabold">{f.value}</dd>
          </div>
        ))}
      </dl>

      {empty && (
        <p className="surface p-6 text-ink-soft">
          Todavía no hay repasos. Cuando hagas tu primera sesión, acá vas a ver tu constancia y tus aciertos.{" "}
          <Link href="/estudiar" className="font-semibold text-azure-strong underline">
            Empezar a estudiar
          </Link>
        </p>
      )}

      <section aria-labelledby="actividad-titulo" className="flex flex-col gap-4">
        <h2 id="actividad-titulo" className="text-2xl font-bold">
          Constancia: últimas 12 semanas
        </h2>
        <div className="surface p-5">
          <Heatmap days={s.heatmap} />
        </div>
      </section>

      <section aria-labelledby="rangos-titulo" className="flex flex-col gap-4">
        <h2 id="rangos-titulo" className="text-2xl font-bold">
          Cómo suben de rango tus cartas
        </h2>
        <Collection stages={s.stages} />
        <p className="max-w-prose text-ink-soft">
          Cada acierto la sube de rango y la aleja en el tiempo:{" "}
          {STAGES.slice(1).map((st) => `${st.name.toLowerCase()} (${st.intervalDays} d)`).join(", ")}. Si fallás, baja dos
          rangos y vuelve enseguida.
        </p>
      </section>

      {s.decks.length > 0 && (
        <section aria-labelledby="precision-titulo" className="flex flex-col gap-4">
          <h2 id="precision-titulo" className="text-2xl font-bold">
            Aciertos por mazo
          </h2>
          <div className="surface p-5">
            <AccuracyBars decks={s.decks} />
          </div>
        </section>
      )}

      <section aria-labelledby="dificiles-titulo" className="flex flex-col gap-4">
        <h2 id="dificiles-titulo" className="text-2xl font-bold">
          Las que más te cuestan
        </h2>
        {s.hard.length === 0 ? (
          <p className="surface p-6 text-ink-soft">Todavía no fallaste ninguna. Cuando pase, aparecen acá.</p>
        ) : (
          <>
            <ul className="surface divide-y divide-line overflow-hidden">
              {s.hard.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{h.term}</p>
                    <p className="truncate text-sm text-ink-soft">
                      {h.meaning} · {h.deck}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-ink-soft">
                    Fallada {h.lapses} {h.lapses === 1 ? "vez" : "veces"}
                  </span>
                </li>
              ))}
            </ul>
            <div>
              <Link href="/estudiar/sesion?source=hard&mode=mixed&limit=20" className="btn btn-primary">
                Practicar las difíciles
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
