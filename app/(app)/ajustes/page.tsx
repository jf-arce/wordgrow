import { LogOut } from "lucide-react";
import { getSettings, getReminderPrefs } from "@/lib/db/queries/settings";
import { SettingsForm } from "@/components/forms/SettingsForm";
import { BackupPanel } from "@/components/BackupPanel";
import { BackLink } from "@/components/ui/BackLink";
import { ReminderSetup } from "@/components/pwa/ReminderSetup";
import { requireUser } from "@/lib/auth/dal";
import { logoutAction } from "@/app/actions/auth";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [settings, reminderPrefs] = await Promise.all([getSettings(user.id), getReminderPrefs(user.id)]);

  return (
    <div className="flex flex-col gap-10">
      <BackLink href="/" label="Estudiar" className="self-start" />
      <h1 className="text-4xl font-extrabold">Ajustes</h1>
      <SettingsForm defaults={settings} />

      <section aria-labelledby="recordatorios-titulo" className="flex flex-col gap-3 border-t border-line pt-8">
        <h2 id="recordatorios-titulo" className="text-2xl font-bold">
          Recordatorios
        </h2>
        <ReminderSetup defaults={reminderPrefs} />
      </section>

      <section aria-labelledby="cuenta-titulo" className="flex flex-col gap-3 border-t border-line pt-8">
        <h2 id="cuenta-titulo" className="text-2xl font-bold">
          Tu cuenta
        </h2>
        <p className="text-ink-soft">
          {user.firstName} {user.lastName} · {user.email}
        </p>
        <div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-quiet">
              <LogOut size={18} aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="datos-titulo" className="flex flex-col gap-3 border-t border-line pt-8">
        <h2 id="datos-titulo" className="text-2xl font-bold">
          Tus datos
        </h2>
        <p className="max-w-prose text-ink-soft">
          Descargá un backup para llevarlo a otro lado o para tener una copia de seguridad.
        </p>
        <BackupPanel />
      </section>
    </div>
  );
}
