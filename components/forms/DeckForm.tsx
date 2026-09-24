"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { createDeckAction, deleteDeckAction, updateDeckAction } from "@/app/actions/decks";
import { DECK_COLORS, DEFAULT_LANG, deckSchema, type DeckInput } from "@/lib/schemas";
import { Field } from "@/components/ui/Field";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deckColor } from "@/components/ui/DeckColor";

const COLOR_NAMES: Record<(typeof DECK_COLORS)[number], string> = {
  leaf: "Azul",
  sun: "Dorado",
  lilac: "Lila",
  sky: "Celeste",
  rose: "Rosa",
};

export function DeckForm({ deckId, defaults }: { deckId?: number; defaults?: DeckInput }) {
  const router = useRouter();
  const editing = deckId !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DeckInput>({
    resolver: zodResolver(deckSchema),
    defaultValues: defaults ?? { name: "", description: "", color: "leaf", lang: DEFAULT_LANG },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Sólo se estudia inglés por ahora: no se ofrece elegir idioma.
    const input = { ...values, lang: DEFAULT_LANG };
    const res = editing ? await updateDeckAction(deckId, input) : await createDeckAction(input);
    if (!res.ok) {
      setError("root", { message: res.error });
      return;
    }
    router.push(editing ? `/mazos/${deckId}` : `/mazos/${(res as { data: { id: number } }).data.id}`);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-6">
      <Field id="deck-name" label="Nombre" error={errors.name?.message}>
        {(p) => (
          <input
            {...p}
            {...register("name")}
            className="field-input"
            placeholder="Ej.: Unit 4, phrasal verbs"
            autoComplete="off"
            autoFocus={!editing}
          />
        )}
      </Field>

      <Field
        id="deck-description"
        label="Descripción (opcional)"
        hint="Para acordarte de qué trata: clase, libro, tema."
        error={errors.description?.message}
      >
        {(p) => <textarea {...p} {...register("description")} className="field-input" rows={2} />}
      </Field>

      <fieldset>
        <legend className="mb-1.5 font-semibold">Color</legend>
        <div className="flex flex-wrap gap-3">
          {DECK_COLORS.map((color) => {
            const c = deckColor(color);
            return (
              <label key={color} className="relative cursor-pointer">
                <input type="radio" value={color} {...register("color")} className="peer visually-hidden" />
                <span
                  className={`grid size-11 place-items-center rounded-full ${c.dot} ring-offset-2 ring-offset-mist peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-(--focus) [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100`}
                >
                  <Check size={20} strokeWidth={3} aria-hidden className="text-ink" />
                  <span className="visually-hidden">{COLOR_NAMES[color]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {errors.root && (
        <p role="alert" className="font-medium text-berry-ink">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {editing ? "Guardar cambios" : "Crear mazo"}
        </button>
        <Link href={editing ? `/mazos/${deckId}` : "/mazos"} className="btn btn-quiet">
          Cancelar
        </Link>
        {editing && (
          <ConfirmButton
            className="btn btn-danger ml-auto"
            title="¿Borrar este mazo?"
            description="Se borran también todas sus palabras y su historial de repasos. No se puede deshacer."
            confirmLabel="Borrar mazo"
            onConfirm={async () => {
              const res = await deleteDeckAction(deckId);
              if (res.ok) router.push("/mazos");
            }}
          >
            Borrar mazo
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}
