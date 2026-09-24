"use client";

import { forwardRef, useRef } from "react";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { stageInfo } from "@/lib/srs";
import type { QuizItem } from "@/lib/quiz";
import { WordCard } from "@/components/card/WordCard";
import { useCardTilt } from "@/components/card/useCardTilt";
import { SpeakButton } from "@/components/SpeakButton";
import { FoxMark } from "@/components/brand/FoxMark";
import { foxMessage } from "@/lib/fox-messages";
import type { Answered } from "./types";

function headline(item: QuizItem, a: Answered) {
  if (a.close) return "¡Casi! La repasaremos pronto";
  if (a.result === "correct") return "¡Correcto!";
  if (a.result === "unsure") return "Anotado: te la vamos a mostrar pronto";
  return item.mode === "typed" || item.mode === "cloze" ? "Todavía no" : "No era esa";
}

export const Feedback = forwardRef<
  HTMLButtonElement,
  { item: QuizItem; answered: Answered; isLast: boolean; rate: number; voiceName?: string; onNext: () => void; foxMessageIndex: number }
>(function Feedback({ item, answered, isLast, rate, voiceName = "", onNext, foxMessageIndex }, nextRef) {
  const ok = answered.result === "correct";
  const unsure = answered.result === "unsure";
  const leveledUp = ok && answered.stageAfter > item.stage;
  const Icon = ok ? CircleCheck : unsure ? Clock : CircleX;
  const stage = stageInfo(answered.stageAfter);
  const lang = item.lang.split("-")[0];
  const cardRef = useRef<HTMLDivElement>(null);
  const tilt = useCardTilt(cardRef);
  const message = foxMessage(answered.result, foxMessageIndex);

  return (
    <div
      className={`anim-flip flex flex-col gap-4 rounded-3xl p-5 sm:p-6 ${ok ? "bg-azure-soft" : unsure ? "bg-gold-soft" : "bg-berry-soft"}`}
    >
      <div className="flex items-center gap-3">
        <FoxMark size={64} expression={ok ? "celebrate" : unsure ? "neutral" : "retry"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
          <Icon
            size={30}
            aria-hidden
            className={`shrink-0 ${ok ? "text-azure-strong" : unsure ? "text-gold-ink" : "text-berry-ink"}`}
          />
          <p className={`text-2xl font-bold ${ok ? "text-azure-strong" : unsure ? "text-gold-ink" : "text-berry-ink"}`}>
            {headline(item, answered)}
          </p>
          </div>
          <p className="mt-1 text-sm text-ink">{message}</p>
        </div>
      </div>
      {/* Región corta y dedicada para lectores de pantalla: el bloque grande de abajo no necesita repetirse. */}
      <p role="status" aria-live="polite" className="visually-hidden">
        {headline(item, answered)}
        {` ${message}`}
        {leveledUp ? `. La carta subió a ${stage.name.toLowerCase()}.` : ""}
      </p>

      <div className="flex flex-col gap-4 rounded-2xl bg-paper p-4 text-ink sm:flex-row sm:items-center">
        <div
          ref={cardRef}
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
          className={`shrink-0 self-center ${tilt.className} ${ok ? "anim-impact" : ""} ${leveledUp ? "anim-levelup" : ""}`}
        >
          <WordCard term={item.term} stage={answered.stageAfter} lang={item.lang} size="small" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xl font-bold" lang={lang}>
              {item.term}
            </p>
            <SpeakButton text={item.term} lang={item.lang} rate={rate} voiceName={voiceName} withSlow />
          </div>
          <p lang="es">{item.meaning}</p>
          {item.example && (
            <p className="mt-1 text-ink-soft italic" lang={lang}>
              “{item.example}”
            </p>
          )}
          {answered.result === "wrong" && answered.typed && (
            <p className="mt-2 text-sm text-ink-soft">
              Escribiste: <span lang={lang}>“{answered.typed}”</span>
            </p>
          )}
          <p className="mt-2 font-semibold text-ink">
            {leveledUp ? `¡Subió de rango! Ahora es ${stage.name.toLowerCase()}` : `Sigue siendo ${stage.name.toLowerCase()}`}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button ref={nextRef} type="button" className="btn btn-primary btn-large" onClick={onNext} aria-keyshortcuts="Enter">
          {isLast ? "Ver resultados" : "Siguiente"}
        </button>
      </div>
    </div>
  );
});
