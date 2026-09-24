import { getReminderPrefs } from "@/lib/db/queries/settings";
import { requireUser } from "@/lib/auth/dal";
import { ReminderTimer } from "./ReminderTimer";

/** Trae las preferencias de recordatorio aparte del resto de `AppLayout`: no pinta nada
 * (el timer sólo programa una notificación), así que no vale la pena bloquear el shell
 * esperándolo. */
export async function ReminderTimerLoader() {
  const user = await requireUser();
  const prefs = await getReminderPrefs(user.id);
  return <ReminderTimer prefs={prefs} />;
}
