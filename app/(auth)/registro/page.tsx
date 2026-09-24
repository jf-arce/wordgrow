import Link from "next/link";
import { SignupForm } from "@/components/forms/SignupForm";

export const metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Creá tu cuenta</h1>
        <p className="mt-1 text-ink-soft">Así tu progreso, tus mazos y tu racha quedan guardados a tu nombre.</p>
      </div>
      <SignupForm />
      <p className="text-center text-ink-soft">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingresar" className="font-semibold text-azure-strong underline">
          Entrá
        </Link>
      </p>
    </div>
  );
}
