"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoadingFrame, PendingButton } from "./Skeleton";

/** Los campos empiezan vacíos; sólo se espera la comprobación de sesión. */
export function AuthSkeleton() {
  const signup = usePathname() === "/registro";
  return (
    <LoadingFrame label="Comprobando sesión" className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">{signup ? "Creá tu cuenta" : "Bienvenido/a de nuevo"}</h1>
        <p className="mt-1 text-ink-soft">{signup ? "Así tu progreso, tus mazos y tu racha quedan guardados a tu nombre." : "Entrá para seguir con tu progreso."}</p>
      </div>
      <fieldset disabled className="flex flex-col gap-5">
        {signup && <div className="grid gap-5 sm:grid-cols-2"><EmptyField label="Nombre" id="loading-first-name" /><EmptyField label="Apellido" id="loading-last-name" /></div>}
        <EmptyField label="Email" id="loading-email" />
        <EmptyField label="Contraseña" id="loading-password" hint={signup ? "Al menos 8 caracteres, con letras y números." : undefined} />
        {signup && <EmptyField label="Repetir contraseña" id="loading-confirm-password" />}
        <PendingButton className="btn-primary btn-large">{signup ? "Crear cuenta" : "Ingresar"}</PendingButton>
      </fieldset>
      <p className="text-center text-ink-soft">
        {signup ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
        <Link href={signup ? "/ingresar" : "/registro"} className="font-semibold text-azure-strong underline">{signup ? "Entrá" : "Creá una"}</Link>
      </p>
    </LoadingFrame>
  );
}

function EmptyField({ label, id, hint }: { label: string; id: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold">{label}</label>
      <input id={id} disabled className="field-input" />
      {hint && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
