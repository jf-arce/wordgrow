"use client";

import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { checkTyped } from "@/lib/text";
import type { QuizItem } from "@/lib/quiz";
import { CardBack } from "@/components/card/CardBack";
import type { Answered } from "./types";

/** 4 opciones con atajos 1–4. Tras responder marca la correcta y la elegida sin depender solo del color. */
export function ChoiceOptions({
  item,
  answered,
  labelledBy,
  onPick,
}: {
  item: QuizItem;
  answered: Answered | null;
  labelledBy: string;
  onPick: (optionId: number) => void;
}) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="grid gap-3 sm:grid-cols-2">
      {item.options?.map((opt, i) => {
        const isCorrect = opt.id === item.correctOptionId;
        const isPicked = answered?.selectedId === opt.id;
        const state = !answered ? "idle" : isCorrect ? "correct" : isPicked ? "wrong" : "dim";
        return (
          <button
            key={opt.id}
            type="button"
            disabled={!!answered}
            onClick={() => onPick(opt.id)}
            aria-keyshortcuts={String(i + 1)}
            lang={item.mode === "reverse" ? item.lang.split("-")[0] : "es"}
            className={clsx(
              "flex min-h-16 items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-lg font-medium shadow-[4px_4px_0_var(--color-base-content)] transition-transform disabled:cursor-default",
              state === "idle" && "border-ink bg-paper hover:-translate-y-1 hover:bg-azure-soft",
              state === "correct" && "border-azure bg-azure-soft text-ink",
              state === "wrong" && "anim-shake border-berry bg-berry-soft text-berry-ink",
              state === "dim" && "border-line bg-paper text-ink-soft opacity-70",
            )}
          >
            <span
              aria-hidden
              className={clsx(
                "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                state === "correct" ? "bg-azure text-on-azure" : state === "wrong" ? "bg-berry text-berry-strong-ink" : "bg-paper-2 text-ink-soft",
              )}
            >
              {state === "correct" ? <Check size={18} strokeWidth={3} /> : state === "wrong" ? <X size={18} strokeWidth={3} /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">{opt.text}</span>
            {state === "correct" && <span className="visually-hidden">(respuesta correcta)</span>}
            {state === "wrong" && <span className="visually-hidden">(tu respuesta, incorrecta)</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Campo de texto para los modos "escribir" y "completar". */
export function TypedAnswer({
  item,
  disabled,
  onSubmit,
}: {
  item: QuizItem;
  disabled: boolean;
  onSubmit: (typed: string, verdict: "exact" | "close" | "wrong") => void;
}) {
  const [value, setValue] = useState("");
  const [empty, setEmpty] = useState(false);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        if (!value.trim()) {
          setEmpty(true);
          return;
        }
        onSubmit(value, checkTyped(value, item.answer));
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="typed-answer" className="font-semibold">
        Tu respuesta
      </label>
      <input
        id="typed-answer"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          setValue(e.target.value);
          setEmpty(false);
        }}
        autoFocus
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        lang={item.lang.split("-")[0]}
        aria-invalid={empty || undefined}
        aria-describedby={empty ? "typed-error" : undefined}
        className="field-input min-h-14 text-xl"
        placeholder="Escribí acá"
      />
      {empty && (
        <p id="typed-error" role="alert" className="text-sm font-medium text-berry-ink">
          Escribí una respuesta, o tocá “No sé” para ver la solución.
        </p>
      )}
      {!disabled && (
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary">
            Comprobar
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onSubmit("", "wrong")}>
            No sé
          </button>
        </div>
      )}
    </form>
  );
}

/** Dar vuelta la tarjeta y autoevaluarse. */
export function FlashcardActions({
  item,
  revealed,
  disabled,
  onReveal,
  onGrade,
}: {
  item: QuizItem;
  revealed: boolean;
  disabled: boolean;
  onReveal: () => void;
  onGrade: (result: "wrong" | "unsure" | "correct") => void;
}) {
  const reduceMotion = useReducedMotion();

  if (!revealed) {
    return (
      <div className="flex w-full flex-col items-center gap-5">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="w-36 cursor-pointer border-0 bg-transparent p-0"
          onClick={onReveal}
        >
          <CardBack />
        </button>
        <button type="button" className="btn btn-primary btn-large" onClick={onReveal} aria-keyshortcuts="Space">
          <Eye size={20} aria-hidden />
          Dar vuelta
        </button>
      </div>
    );
  }
  return (
    <div className="flex w-full flex-col items-center gap-4" style={{ perspective: 1200 }}>
      <motion.div
        className="surface w-full max-w-xl p-5 text-center"
        style={{ transformOrigin: "50% 50%" }}
        initial={reduceMotion ? undefined : { rotateY: -90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.9, 0.3, 1] }}
        lang="es"
      >
        <p className="text-2xl font-bold">{item.meaning}</p>
        {item.example && (
          <p className="mt-2 text-ink-soft italic" lang={item.lang.split("-")[0]}>
            “{item.example}”
          </p>
        )}
      </motion.div>
      {!disabled && (
        <div role="group" aria-label="¿La sabías?" className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
          <button type="button" className="btn btn-danger btn-large" onClick={() => onGrade("wrong")} aria-keyshortcuts="1">
            No la sabía
          </button>
          <button type="button" className="btn btn-quiet btn-large" onClick={() => onGrade("unsure")} aria-keyshortcuts="2">
            Dudé
          </button>
          <button type="button" className="btn btn-primary btn-large" onClick={() => onGrade("correct")} aria-keyshortcuts="3">
            La sabía
          </button>
        </div>
      )}
    </div>
  );
}
