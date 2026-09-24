"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Field } from "@/components/ui/Field";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    const res = await loginAction(values);
    // Si sale bien, loginAction ya redirigió: sólo llegamos acá cuando falló.
    if (!res.ok) setError("root", { message: res.error });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="email" label="Email" error={errors.email?.message}>
        {(p) => <input {...p} {...register("email")} type="email" autoComplete="email" className="field-input" />}
      </Field>
      <Field id="password" label="Contraseña" error={errors.password?.message}>
        {(p) => (
          <input {...p} {...register("password")} type="password" autoComplete="current-password" className="field-input" />
        )}
      </Field>
      {errors.root && (
        <p role="alert" className="font-medium text-berry-ink">
          {errors.root.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
        Entrar
      </button>
    </form>
  );
}
