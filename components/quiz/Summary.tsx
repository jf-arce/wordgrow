"use client";

import Link from "next/link";
import { useRef } from "react";
import { CircleCheck, CircleX, Clock, RotateCcw } from "lucide-react";
import { stageInfo } from "@/lib/srs";
import { WordCard } from "@/components/card/WordCard";
import { useCardTilt } from "@/components/card/useCardTilt";
import type { FirstAttempt } from "./types";

function LeveledCard({ attempt }: { attempt: FirstAttempt }) {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useCardTilt(ref);
  return (
    <div
      ref={ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className={tilt.className}
    >
      <WordCard
        term={attempt.item.term}
        stage={attempt.stageAfter}
        lang={attempt.item.lang}
        size="small"
        title={`${attempt.item.term}, rango ${stageInfo(attempt.stageAfter).name}`}
      />
    </div>
  );
}

export function Summary({
  attempts,
  practice,
  exitHref,
  onPractice,
  saveError,
}: {
  attempts: FirstAttempt[];
  practice: boolean;
  exitHref: string;
  onPractice: (missed: FirstAttempt[]) => void;
  saveError: boolean;
}) {
  const correct = attempts.filter((a) => a.result === "correct").length;
  const missed = attempts.filter((a) => a.result !== "correct");
  const leveledUp = attempts.filter((a) => a.stageAfter > a.item.stage);
  const total = attempts.length;
  const perfect = correct === total;

  const title = perfect ? "¡Sesión perfecta!" : practice ? "Entrenamiento terminado" : "¡Buena sesión!";

  return (
    <div className="m-auto flex w-full flex-col gap-8 py-8">
      <div>
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-2 text-xl text-ink-soft">
          Acertaste <span className="font-bold text-ink">{correct}</span> de {total} a la primera.
        </p>
        {practice && <p className="mt-1 text-ink-soft">Este entrenamiento extra no cambia tu calendario de repaso.</p>}
      </div>

      {saveError && (
        <p role="alert" className="rounded-2xl bg-berry-soft p-4 font-medium text-berry-ink">
          Alguna respuesta no se pudo guardar. Revisá que la app siga corriendo y repetí la sesión si hace falta.
        </p>
      )}

      {leveledUp.length > 0 && (
        <section aria-labelledby="subieron-titulo">
          <h2 id="subieron-titulo" className="mb-3 text-xl font-bold">
            {leveledUp.length === 1 ? "Esta carta subió de rango" : "Estas cartas subieron de rango"}
          </h2>
          <div className="flex flex-wrap gap-4">
            {leveledUp.map((a) => (
              <LeveledCard key={a.item.cardId} attempt={a} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo" className="mb-3 text-xl font-bold">
          Cómo quedó cada carta
        </h2>
        <ul className="surface divide-y divide-line overflow-hidden">
          {attempts.map((a) => {
            const Icon = a.result === "correct" ? CircleCheck : a.result === "unsure" ? Clock : CircleX;
            const label = a.result === "correct" ? "Acertada" : a.result === "unsure" ? "Con dudas" : "Fallada";
            return (
              <li key={a.item.cardId} className="flex items-center gap-3 px-4 py-3">
                <Icon
                  size={22}
                  aria-hidden
                  className={a.result === "correct" ? "text-azure-strong" : a.result === "unsure" ? "text-gold-ink" : "text-berry-ink"}
                />
                <span className="visually-hidden">{label}:</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold" lang={a.item.lang.split("-")[0]}>
                    {a.item.term}
                  </p>
                  <p className="truncate text-sm text-ink-soft" lang="es">
                    {a.item.meaning}
                  </p>
                </div>
                <span className="text-sm text-ink-soft">{stageInfo(a.stageAfter).name}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {missed.length > 0 && (
          <button type="button" className="btn btn-primary btn-large" onClick={() => onPractice(missed)}>
            <RotateCcw size={20} aria-hidden />
            Practicar las {missed.length} {missed.length === 1 ? "fallada" : "falladas"}
          </button>
        )}
        <Link href={exitHref} className={`btn btn-large ${missed.length > 0 ? "btn-quiet" : "btn-primary"}`}>
          Terminar
        </Link>
      </div>
    </div>
  );
}
