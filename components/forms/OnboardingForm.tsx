"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveSettingsAction } from "@/app/actions/settings";
import { settingsSchema, type SettingsInput } from "@/lib/schemas";
import { Field } from "@/components/ui/Field";

const THEMES = [
  { value: "system", label: "Automático" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
] as const;

/** Primer paso de configuración, justo después de registrarse: sólo lo esencial para arrancar. */
export function OnboardingForm({ defaults }: { defaults: SettingsInput }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: defaults });

  const onSubmit = handleSubmit(async (values) => {
    await saveSettingsAction(values);
    router.push("/");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Field
        id="onboarding-dailyGoal"
        label="Meta diaria de repasos"
        hint="Cuántas preguntas querés responder por día. Lo podés cambiar cuando quieras en Ajustes."
      >
        {(p) => (
          <input
            {...p}
            {...register("dailyGoal", { valueAsNumber: true })}
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            className="field-input max-w-32"
          />
        )}
      </Field>

      <fieldset>
        <legend className="mb-2 font-semibold">Tema</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {THEMES.map((t) => (
            <label
              key={t.value}
              className="surface flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 has-checked:border-azure has-checked:bg-azure-soft has-focus-visible:outline-3 has-focus-visible:outline-(--focus)"
            >
              <input type="radio" value={t.value} {...register("theme")} className="size-4 accent-(--azure)" />
              <span className="font-semibold">{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn btn-primary btn-large self-start" disabled={isSubmitting}>
        Empezar a estudiar
      </button>
    </form>
  );
}
