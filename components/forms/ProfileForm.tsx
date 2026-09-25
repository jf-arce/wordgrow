"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveProfileAction } from "@/app/actions/profile";
import { profileSchema, type ProfileInput } from "@/lib/schemas";
import { Field } from "@/components/ui/Field";

export function ProfileForm({ defaults }: { defaults: ProfileInput }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults });

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    const res = await saveProfileAction(values);
    if (!res.ok) {
      setError("root", { message: res.error });
      return;
    }
    setSaved(true);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="firstName" label="Nombre" error={errors.firstName?.message}>
          {(p) => <input {...p} {...register("firstName")} autoComplete="given-name" className="field-input" />}
        </Field>
        <Field id="lastName" label="Apellido" error={errors.lastName?.message}>
          {(p) => <input {...p} {...register("lastName")} autoComplete="family-name" className="field-input" />}
        </Field>
      </div>

      {errors.root && (
        <p role="alert" className="font-medium text-berry-ink">
          {errors.root.message}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          Guardar cambios
        </button>
        <p role="status" className="font-medium text-azure-strong">
          {saved ? "Perfil actualizado" : ""}
        </p>
      </div>
    </form>
  );
}
