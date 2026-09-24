import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Bienvenido/a de nuevo</h1>
        <p className="mt-1 text-ink-soft">Entrá para seguir con tu progreso.</p>
      </div>
      <LoginForm />
      <p className="text-center text-ink-soft">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-semibold text-azure-strong underline">
          Creá una
        </Link>
      </p>
    </div>
  );
}
