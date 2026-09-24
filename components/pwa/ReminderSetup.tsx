"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { saveReminderPrefsAction } from "@/app/actions/settings";
import { FREQUENCY_PRESETS, type ReminderPrefs } from "@/lib/reminders";

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function sameDays(a: number[], b: number[]) {
  return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
}

export function ReminderSetup({ defaults }: { defaults: ReminderPrefs }) {
  const [enabled, setEnabled] = useState(defaults.enabled);
  const [days, setDays] = useState(defaults.days);
  const [time, setTime] = useState(defaults.time);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: number) => {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
    setSaved(false);
  };

  async function handleEnable() {
    if (!enabled && permission !== "granted" && "Notification" in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res !== "granted") return;
    }
    setEnabled((v) => !v);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await saveReminderPrefsAction({ enabled, days, time });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">Un aviso cuando te toca practicar, mientras tengas WordGrow abierto.</p>
        <button
          type="button"
          onClick={handleEnable}
          aria-pressed={enabled}
          className={`btn btn-small ${enabled ? "btn-primary" : "btn-quiet"}`}
        >
          {enabled ? <Bell size={16} aria-hidden /> : <BellOff size={16} aria-hidden />}
          {enabled ? "Activados" : "Activar"}
        </button>
      </div>

      {permission === "denied" && (
        <p role="alert" className="text-sm text-berry-ink">
          Bloqueaste las notificaciones para este sitio. Habilitalas desde la configuración del navegador para
          recibir el recordatorio.
        </p>
      )}
      {permission === "unsupported" && (
        <p className="text-sm text-ink-soft">Este navegador no admite notificaciones.</p>
      )}

      {enabled && (
        <>
          <div>
            <p className="mb-2 text-sm font-semibold">Frecuencia</p>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setDays(p.days);
                    setSaved(false);
                  }}
                  className={`btn btn-small ${sameDays(days, p.days) ? "btn-primary" : "btn-quiet"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Días de la semana">
            <p className="mb-2 text-sm font-semibold">O elegí los días</p>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((label, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  aria-pressed={days.includes(d)}
                  aria-label={DAY_NAMES[d]}
                  className={`grid size-10 place-items-center rounded-full border-2 font-semibold ${
                    days.includes(d) ? "border-azure bg-azure-soft text-azure-strong" : "border-line text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="reminder-time" className="mb-1.5 block text-sm font-semibold">
              Horario
            </label>
            <input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setSaved(false);
              }}
              className="field-input max-w-40"
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-4">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          Guardar recordatorio
        </button>
        <p role="status" className="font-medium text-azure-strong">
          {saved ? "Guardado" : ""}
        </p>
      </div>
    </div>
  );
}
