"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupAction } from "@/app/actions/auth";
import { signupSchema, type SignupInput } from "@/lib/schemas";
import { Field } from "@/components/ui/Field";

export function SignupForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await signupAction(values);
    // Si sale bien, signupAction ya redirigió a /bienvenida: sólo llegamos acá cuando falló.
    if (!res.ok) setError("root", { message: res.error });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="firstName" label="Nombre" error={errors.firstName?.message}>
          {(p) => <input {...p} {...register("firstName")} autoComplete="given-name" className="field-input" />}
        </Field>
        <Field id="lastName" label="Apellido" error={errors.lastName?.message}>
          {(p) => <input {...p} {...register("lastName")} autoComplete="family-name" className="field-input" />}
        </Field>
      </div>
      <Field id="email" label="Email" error={errors.email?.message}>
        {(p) => <input {...p} {...register("email")} type="email" autoComplete="email" className="field-input" />}
      </Field>
      <Field id="password" label="Contraseña" hint="Al menos 8 caracteres, con letras y números." error={errors.password?.message}>
        {(p) => (
          <input {...p} {...register("password")} type="password" autoComplete="new-password" className="field-input" />
        )}
      </Field>
      <Field id="confirmPassword" label="Repetir contraseña" error={errors.confirmPassword?.message}>
        {(p) => (
          <input
            {...p}
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
            className="field-input"
          />
        )}
      </Field>

      {errors.root && (
        <p role="alert" className="font-medium text-berry-ink">
          {errors.root.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
        Crear cuenta
      </button>
    </form>
  );
}
