"use client";

import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Clock, X } from "lucide-react";
import { stageInfo } from "@/lib/srs";
import { WordCard } from "@/components/card/WordCard";
import type { FirstAttempt } from "./types";

/**
 * Vista de sólo lectura de una respuesta ya dada: no deja volver a responder ni toca el
 * SRS. Sirve para mirar de nuevo cómo te fue en una pregunta anterior sin reiniciar nada.
 */
export function ReviewCard({
  attempt,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  attempt: FirstAttempt;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { item, result } = attempt;
  const ok = result === "correct";
  const unsure = result === "unsure";
  const Icon = ok ? CircleCheck : unsure ? Clock : CircleX;
  const label = ok ? "Acertada" : unsure ? "Con dudas" : "Fallada";
  const lang = item.lang.split("-")[0];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-soft">
          Revisando {index + 1} de {total}
        </p>
        <button type="button" className="btn btn-quiet btn-small" onClick={onClose}>
          <X size={16} aria-hidden />
          Volver a la pregunta actual
        </button>
      </header>

      <div
        className={`flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6 ${ok ? "bg-azure-soft" : unsure ? "bg-gold-soft" : "bg-berry-soft"}`}
      >
        <div className="shrink-0 self-center">
          <WordCard term={item.term} stage={attempt.stageAfter} lang={item.lang} size="small" />
        </div>
        <div className="min-w-0 flex-1 rounded-2xl bg-paper p-4 text-ink">
          <div className="flex items-center gap-2">
            <Icon size={20} aria-hidden className={ok ? "text-azure-strong" : unsure ? "text-gold-ink" : "text-berry-ink"} />
            <span className="font-semibold">{label}</span>
          </div>
          <p className="mt-2 text-xl font-bold" lang={lang}>
            {item.term}
          </p>
          <p lang="es">{item.meaning}</p>
          {item.example && (
            <p className="mt-1 text-ink-soft italic" lang={lang}>
              “{item.example}”
            </p>
          )}
          {attempt.typed && (
            <p className="mt-2 text-sm text-ink-soft">
              Escribiste: <span lang={lang}>“{attempt.typed}”</span>
            </p>
          )}
          <p className="mt-2 text-sm text-ink-soft">Rango: {stageInfo(attempt.stageAfter).name}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn btn-quiet" onClick={onPrev} disabled={index === 0}>
          <ArrowLeft size={18} aria-hidden />
          Anterior
        </button>
        <button type="button" className="btn btn-quiet" onClick={onNext} disabled={index + 1 >= total}>
          Siguiente
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
