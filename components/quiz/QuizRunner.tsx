"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { answerSessionAction, advanceSessionAction } from "@/app/actions/session";
import { nextProgress, type Result } from "@/lib/srs";
import type { QuizItem } from "@/lib/quiz";
import type { SessionAnswer } from "@/lib/db/queries/session";
import { BackLink } from "@/components/ui/BackLink";
import { SpeakButton, useSpeech } from "@/components/SpeakButton";
import { ChoiceOptions, FlashcardActions, TypedAnswer } from "./Questions";
import { Feedback } from "./Feedback";
import { Summary } from "./Summary";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { ReviewCard } from "./ReviewCard";
import type { Answered, FirstAttempt, QueueItem } from "./types";

const INSTRUCTIONS: Record<QuizItem["mode"], string> = {
  choice: "¿Qué significa?",
  reverse: "¿Qué palabra o frase es?",
  typed: "Escribí la palabra o frase que corresponde a este significado",
  cloze: "Completá la oración",
  flashcard: "Pensá el significado y después dala vuelta",
};

const toQueue = (items: QuizItem[]): QueueItem[] => items.map((i) => ({ ...i, retry: false }));

export function QuizRunner({
  sessionId,
  initialQueue,
  initialFirsts,
  initialPosition,
  initialAnswer,
  autoplay,
  rate,
  voiceName = "",
  exitHref,
}: {
  /** Id de la fila en `study_sessions`: lo que se guarda mientras respondés. */
  sessionId: number;
  initialQueue: QueueItem[];
  initialFirsts: FirstAttempt[];
  initialPosition: number;
  initialAnswer: SessionAnswer | null;
  autoplay: boolean;
  rate: number;
  voiceName?: string;
  exitHref: string;
}) {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [roundSize, setRoundSize] = useState(() => initialQueue.filter((q) => !q.retry).length);
  const [practice, setPractice] = useState(false);
  const [index, setIndex] = useState(initialPosition);
  const [answered, setAnswered] = useState<Answered | null>(initialAnswer);
  const [revealed, setRevealed] = useState(Boolean(initialAnswer));
  const [firsts, setFirsts] = useState<FirstAttempt[]>(initialFirsts);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pending, setPending] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const startedAt = useRef(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const promptId = useId();

  const item = queue[index];
  const isLast = index + 1 >= queue.length;
  const { speak } = useSpeech(item?.lang ?? "en-US", rate, voiceName);
  const reduceMotion = useReducedMotion();

  const current = Math.min(firsts.length + (answered && !item?.retry ? 0 : 1), roundSize);
  const leveledUp = firsts.filter((f) => f.stageAfter > f.item.stage).length;
  const progressPct = roundSize > 0 ? Math.round((firsts.length / roundSize) * 100) : 0;

  // Nueva pregunta: arrancar el reloj, mover el foco y (opcional) reproducir el audio.
  useEffect(() => {
    startedAt.current = Date.now();
    if (index > 0 || practice) questionRef.current?.focus();
  }, [index, practice]);

  // El autoplay sólo arranca después del primer gesto: los navegadores bloquean el audio
  // que dispara sin interacción previa, y sin este freno el primer intento suena en silencio.
  const playOnShow = useEffectEvent(() => {
    if (autoplay && interacted && item && (item.mode === "choice" || item.mode === "flashcard")) speak(item.term);
  });
  useEffect(() => {
    playOnShow();
  }, [index, practice, interacted]);

  const playOnAnswer = useEffectEvent(() => {
    if (autoplay && interacted && item && answered && item.mode !== "choice" && item.mode !== "flashcard") speak(item.term);
  });
  useEffect(() => {
    playOnAnswer();
  }, [answered]);

  // Tras responder, el foco va al botón "Siguiente".
  useEffect(() => {
    if (answered) nextRef.current?.focus();
  }, [answered]);

  async function commit(result: Result, extra: Pick<Answered, "selectedId" | "typed" | "close"> = {}) {
    if (!item || answered || pending) return;
    const now = Date.now();
    if (practice) {
      const stageAfter = nextProgress({ stage: item.stage, reps: 0, lapses: 0 }, result, now).stage;
      setAnswered({ result, stageAfter, ...extra });
      if (!item.retry) setFirsts((f) => [...f, { item, result, stageAfter, ...extra }]);
      return;
    }
    setPending(true);
    setSaveError(false);
    try {
      const res = await answerSessionAction(sessionId, index, { selectedId: extra.selectedId, typed: extra.typed ?? (item.mode === "typed" || item.mode === "cloze" ? "" : undefined), grade: item.mode === "flashcard" ? result : undefined, responseMs: Math.min(3_600_000, Math.max(0, now - startedAt.current)) });
      if (!res.ok) { setSaveError(true); return; }
      setAnswered(res.data.answer);
      setQueue(res.data.queue);
      setFirsts(res.data.firsts);
    } catch { setSaveError(true); }
    finally { setPending(false); }
  }

  async function next() {
    if (pending) return;
    if (!practice) {
      setPending(true);
      try {
        const res = await advanceSessionAction(sessionId, index);
        if (!res.ok) { setSaveError(true); return; }
        if (res.data.finished) { setFinished(true); return; }
      } catch { setSaveError(true); return; }
      finally { setPending(false); }
    } else if (isLast) { setFinished(true); return; }
    setIndex((i) => i + 1);
    setAnswered(null);
    setRevealed(false);
  }

  function startPractice(missed: FirstAttempt[]) {
    setQueue(toQueue(missed.map((m) => m.item)));
    setRoundSize(missed.length);
    setPractice(true);
    setIndex(0);
    setAnswered(null);
    setRevealed(false);
    setFirsts([]);
    setFinished(false);
  }

  const pickOption = (optionId: number) => commit(optionId === item?.correctOptionId ? "correct" : "wrong", { selectedId: optionId });

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (finished || !item || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement;
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    const onButton = target.tagName === "BUTTON" || target.tagName === "A";
    if (typing) return;

    if (reviewIndex !== null) {
      if (e.key === "Escape") setReviewIndex(null);
      return;
    }

    if (answered) {
      if (e.key === "Enter" && !onButton) {
        e.preventDefault();
        next();
      }
      return;
    }

    if ((item.mode === "choice" || item.mode === "reverse") && /^[1-4]$/.test(e.key)) {
      const opt = item.options?.[Number(e.key) - 1];
      if (opt) pickOption(opt.id);
    } else if (item.mode === "flashcard") {
      if (!revealed && (e.key === " " || e.key === "Enter") && !onButton) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && /^[1-3]$/.test(e.key)) {
        commit((["wrong", "unsure", "correct"] as const)[Number(e.key) - 1]);
      }
    }
    if (e.key.toLowerCase() === "s" && (item.mode === "choice" || item.mode === "flashcard")) speak(item.term);
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (interacted) return;
    const mark = () => setInteracted(true);
    window.addEventListener("pointerdown", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, [interacted]);

  if (finished) {
    return (
      <Summary attempts={firsts} practice={practice} exitHref={exitHref} onPractice={startPractice} saveError={saveError} />
    );
  }

  if (reviewIndex !== null) {
    return (
      <ReviewCard
        attempt={firsts[reviewIndex]}
        index={reviewIndex}
        total={firsts.length}
        onPrev={() => setReviewIndex((i) => Math.max(0, (i ?? 0) - 1))}
        onNext={() => setReviewIndex((i) => Math.min(firsts.length - 1, (i ?? 0) + 1))}
        onClose={() => setReviewIndex(null)}
      />
    );
  }

  const lang = item.lang.split("-")[0];
  const showsTerm = item.mode === "choice" || item.mode === "flashcard";
  const parts = item.mode === "cloze" ? item.prompt.split("_____") : null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex items-center gap-3 sm:gap-4">
        <BackLink href={exitHref} label="Salir" className="btn-small shrink-0" />
        {firsts.length > 0 && (
          <button
            type="button"
            className="btn btn-quiet btn-small shrink-0"
            onClick={() => setReviewIndex(firsts.length - 1)}
          >
            <ArrowLeft size={16} aria-hidden />
            Ver anterior
          </button>
        )}
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-ink-soft">
            <span className="tabular-nums">
              {current} / {roundSize}
            </span>
            {leveledUp > 0 && (
              <span className="flex items-center gap-1 text-azure-strong">
                🂠 {leveledUp} {leveledUp === 1 ? "carta subió" : "cartas subieron"}
              </span>
            )}
          </div>
          <div
            role="progressbar"
            aria-label="Progreso de la sesión"
            aria-valuemin={0}
            aria-valuemax={roundSize}
            aria-valuenow={firsts.length}
            className="h-3 w-full overflow-hidden rounded-full bg-paper-2"
          >
            <motion.div
              className="h-full rounded-full bg-azure"
              animate={{ width: `${progressPct}%` }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }}
            />
          </div>
        </div>
        <ShortcutsHelp />
      </header>

      {practice && <p className="text-sm font-semibold text-lilac-ink">Entrenamiento extra: no cambia tu calendario.</p>}
      {item.retry && <p className="text-sm font-semibold text-lilac-ink">¡Contraataca! Te vuelve a preguntar esta.</p>}
      {saveError && (
        <p role="alert" className="rounded-2xl bg-berry-soft p-3 text-sm font-medium text-berry-ink">
          No se pudo guardar una respuesta. Revisá que la app siga corriendo.
        </p>
      )}

      <motion.section
        key={`${practice}-${index}`}
        aria-labelledby={promptId}
        initial={reduceMotion ? undefined : { opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1] }}
        className={clsx("flex flex-1 flex-col justify-start gap-6 pb-8", item.mode === "flashcard" ? "items-center pt-[4vh]" : "pt-[6vh]")}
      >
        <div className={clsx("surface flex w-full max-w-3xl flex-col gap-3 p-5 sm:p-6", item.mode === "flashcard" && "mx-auto items-center text-center")}>
          <h1
            id={promptId}
            ref={questionRef}
            tabIndex={-1}
            className="text-lg font-semibold text-ink-soft outline-none"
          >
            {INSTRUCTIONS[item.mode]}
          </h1>

          {parts ? (
            <p className="text-3xl leading-snug font-bold sm:text-4xl" lang={lang}>
              {parts.map((part, i) => <span key={i}>{i > 0 && <span className="mx-1 inline-block min-w-24 border-b-4 border-azure align-baseline">{answered ? <span className="text-azure-strong">{item.answer}</span> : <span aria-label="espacio en blanco">&nbsp;</span>}</span>}{part}</span>)}
            </p>
          ) : (
            <p
              className="font-display text-5xl leading-[1.05] font-extrabold tracking-tight break-words sm:text-6xl"
              lang={item.mode === "choice" || item.mode === "flashcard" ? lang : "es"}
            >
              {item.prompt}
            </p>
          )}

          {item.mode === "cloze" && (
            <p className="text-ink-soft" lang="es">
              Significa: {item.meaning}
            </p>
          )}

          {(showsTerm || answered) && (
            <SpeakButton text={item.term} lang={item.lang} rate={rate} voiceName={voiceName} withSlow className={item.mode === "flashcard" ? "self-center" : "self-start"} />
          )}
        </div>

        {(item.mode === "choice" || item.mode === "reverse") && (
          <ChoiceOptions item={item} answered={answered} labelledBy={promptId} onPick={pickOption} />
        )}

        {(item.mode === "typed" || item.mode === "cloze") && (
          <TypedAnswer
            key={`${practice}-${index}`}
            item={item}
            disabled={!!answered}
            onSubmit={(typed, verdict) =>
              commit(verdict === "wrong" ? "wrong" : verdict === "close" ? "unsure" : "correct", { typed, close: verdict === "close" })
            }
          />
        )}

        {item.mode === "flashcard" && (
          <FlashcardActions
            item={item}
            revealed={revealed}
            disabled={!!answered}
            onReveal={() => setRevealed(true)}
            onGrade={(r) => commit(r)}
          />
        )}

        {answered && (
          <Feedback ref={nextRef} item={item} answered={answered} isLast={isLast} rate={rate} voiceName={voiceName} onNext={next} />
        )}
      </motion.section>
    </div>
  );
}
