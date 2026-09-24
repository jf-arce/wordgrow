import Link from "next/link";
import { getSettings, getReminderPrefs } from "@/lib/db/queries/settings";
import { OnboardingForm } from "@/components/forms/OnboardingForm";
import { ReminderSetup } from "@/components/pwa/ReminderSetup";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Bienvenido/a" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const [settings, reminderPrefs] = await Promise.all([getSettings(user.id), getReminderPrefs(user.id)]);

  return (
    <div className="m-auto flex w-full max-w-lg flex-col gap-8 py-10">
      <div>
        <h1 className="text-4xl font-extrabold">¡Hola, {user.firstName}!</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Configuremos un par de cosas antes de arrancar. Todo esto lo podés cambiar después en Ajustes.
        </p>
      </div>

      <OnboardingForm defaults={settings} />

      <section aria-labelledby="recordatorios-titulo" className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 id="recordatorios-titulo" className="text-xl font-bold">
          Recordatorios (opcional)
        </h2>
        <ReminderSetup defaults={reminderPrefs} />
      </section>

      <Link href="/" className="text-center text-ink-soft underline-offset-4 hover:underline">
        Saltear y empezar ya
      </Link>
    </div>
  );
}
