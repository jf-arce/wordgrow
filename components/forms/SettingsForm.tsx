"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveSettingsAction } from "@/app/actions/settings";
import { settingsSchema, type SettingsInput } from "@/lib/schemas";
import { Field } from "@/components/ui/Field";
import { SpeakButton, useVoices } from "@/components/SpeakButton";

const THEMES = [
  { value: "system", label: "Automático", hint: "Sigue la configuración de tu dispositivo." },
  { value: "light", label: "Claro", hint: "" },
  { value: "dark", label: "Oscuro", hint: "" },
] as const;

export function SettingsForm({ defaults }: { defaults: SettingsInput }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: defaults });

  const rate = useWatch({ control, name: "ttsRate" });
  const voiceName = useWatch({ control, name: "ttsVoice" });
  const voices = useVoices();
  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    const res = await saveSettingsAction(values);
    if (!res.ok) {
      setError("root", { message: res.error });
      return;
    }
    setSaved(true);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-7">
      <Field
        id="dailyGoal"
        label="Meta diaria de repasos"
        hint="Cuántas preguntas querés responder por día para completar el anillo."
        error={errors.dailyGoal?.message}
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

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Audio</legend>
        <Field id="ttsRate" label="Velocidad de la voz" error={errors.ttsRate?.message}>
          {(p) => (
            <select {...p} {...register("ttsRate", { valueAsNumber: true })} className="field-input max-w-48">
              <option value={0.6}>Lenta</option>
              <option value={0.9}>Normal</option>
              <option value={1.1}>Rápida</option>
            </select>
          )}
        </Field>
        <Field id="ttsVoice" label="Voz" error={errors.ttsVoice?.message}>
          {(p) => (
            <select {...p} {...register("ttsVoice")} className="field-input max-w-72">
              <option value="">Automática (la del navegador)</option>
              {englishVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}
        </Field>
        {voices.length === 0 && (
          <p className="text-sm text-ink-soft">
            No encontramos voces instaladas en este navegador. Instalá voces de lectura en el sistema operativo para
            escuchar la pronunciación.
          </p>
        )}
        <div className="flex items-center gap-3">
          <SpeakButton
            text="Hello! Let's grow your vocabulary."
            lang="en-US"
            rate={Number(rate) || 0.9}
            voiceName={voiceName}
          />
          <span className="text-sm text-ink-soft">Probar la voz</span>
        </div>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" {...register("autoplayAudio")} className="size-5 accent-(--azure)" />
          <span>Reproducir la pronunciación automáticamente en las sesiones</span>
        </label>
      </fieldset>

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

      {errors.root && (
        <p role="alert" className="font-medium text-berry-ink">
          {errors.root.message}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          Guardar ajustes
        </button>
        <p role="status" className="font-medium text-azure-strong">
          {saved ? "Ajustes guardados" : ""}
        </p>
      </div>
    </form>
  );
}
