"use client";

import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cardSchema, type CardInput } from "@/lib/schemas";
import { guessKind, KIND_LABELS, CARD_KINDS } from "@/lib/quiz";
import { KIND_STYLE } from "@/lib/cardKind";
import { KindGlyph } from "@/components/card/KindGlyph";
import { Field } from "@/components/ui/Field";

const EMPTY: CardInput = { term: "", meaning: "", example: "", notes: "", kind: "word" };

/** Formulario de una tarjeta. Sirve para agregar (sin `defaults`) y para editar. */
export function CardEditor({
  idPrefix,
  defaults,
  submitLabel,
  onSubmit,
  onCancel,
  onSuccess,
  autoFocus = false,
  showNotes = false,
}: {
  idPrefix: string;
  defaults?: CardInput;
  submitLabel: string;
  /** Devuelve un mensaje de error o null si salió bien. */
  onSubmit: (values: CardInput) => Promise<string | null>;
  onCancel?: () => void;
  onSuccess?: () => void;
  autoFocus?: boolean;
  showNotes?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    reset,
    getFieldState,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<CardInput>({ resolver: zodResolver(cardSchema), defaultValues: defaults ?? EMPTY });

  const kind = watch("kind");

  const submit = handleSubmit(async (values) => {
    const error = await onSubmit(values);
    if (error) {
      setError("root", { message: error });
      return;
    }
    if (!defaults) {
      reset(EMPTY);
      if (onSuccess) onSuccess();
      else setFocus("term");
    }
  });

  const termField = register("term", {
    onChange: (e) => {
      // Sugiere el tipo mientras escribís, salvo que ya lo hayas elegido a mano.
      if (!getFieldState("kind").isDirty && !dirtyFields.kind) {
        setValue("kind", guessKind(e.target.value), { shouldDirty: false });
      }
    },
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field id={`${idPrefix}-term`} label="Palabra o frase" error={errors.term?.message}>
        {(p) => (
          <input
            {...p}
            {...termField}
            className="field-input"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Ej.: give up"
            autoFocus={autoFocus}
          />
        )}
      </Field>
      <Field id={`${idPrefix}-meaning`} label="Significado" error={errors.meaning?.message}>
        {(p) => (
          <input {...p} {...register("meaning")} className="field-input" autoComplete="off" placeholder="Ej.: rendirse" />
        )}
      </Field>
      <Field
        id={`${idPrefix}-example`}
        label="Ejemplo (opcional)"
        hint="Sirve para el modo “completar la oración”."
        error={errors.example?.message}
        className="sm:col-span-2"
      >
        {(p) => (
          <input
            {...p}
            {...register("example")}
            className="field-input"
            autoComplete="off"
            placeholder="Ej.: Never give up on your goals."
          />
        )}
      </Field>
      <div className="sm:col-span-2">
        <span id={`${idPrefix}-kind-label`} className="mb-1.5 block font-semibold">
          Tipo
        </span>
        <div role="radiogroup" aria-labelledby={`${idPrefix}-kind-label`} className="flex flex-wrap gap-2">
          {CARD_KINDS.map((k) => {
            const style = KIND_STYLE[k];
            const selected = kind === k;
            return (
              <label
                key={k}
                className={clsx(
                  "btn btn-sm gap-1.5 rounded-full",
                  selected ? clsx(style.soft, style.ink, "border-current") : "btn-outline",
                )}
              >
                <input type="radio" value={k} {...register("kind")} className="sr-only" />
                <KindGlyph kind={k} size={16} />
                {KIND_LABELS[k]}
              </label>
            );
          })}
        </div>
        {errors.kind?.message && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-berry-ink">
            {errors.kind.message}
          </p>
        )}
      </div>
      {showNotes && (
        <Field id={`${idPrefix}-notes`} label="Notas (opcional)" error={errors.notes?.message}>
          {(p) => <input {...p} {...register("notes")} className="field-input" autoComplete="off" />}
        </Field>
      )}

      {errors.root && (
        <p role="alert" className="font-medium text-berry-ink sm:col-span-2">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
