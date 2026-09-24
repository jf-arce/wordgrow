"use client";

import { useEffect, useRef } from "react";
import { msUntilNext, type ReminderPrefs } from "@/lib/reminders";

const MAX_TIMEOUT = 2_147_483_000; // setTimeout se rompe con retrasos mayores a ~24.8 días (2^31 - 1 ms).

/**
 * Registra el service worker y programa la próxima notificación de recordatorio mientras
 * la app siga abierta. Sin Web Push (VAPID) esto no llega con el navegador cerrado del
 * todo; ver la nota en docs/ideas-futuras.md.
 */
export function ReminderTimer({ prefs }: { prefs: ReminderPrefs }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!prefs.enabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    function schedule() {
      const ms = msUntilNext(prefs, new Date());
      if (ms === null) return;
      timer.current = setTimeout(
        async () => {
          const reg = await navigator.serviceWorker.ready.catch(() => null);
          if (reg) {
            reg.active?.postMessage({
              type: "SHOW_REMINDER",
              title: "Hora de practicar",
              body: "Tenés unos minutos libres para sumar una racha más en WordGrow.",
            });
          } else if (Notification.permission === "granted") {
            new Notification("Hora de practicar", { body: "Tenés unos minutos libres para repasar en WordGrow." });
          }
          schedule();
        },
        Math.min(ms, MAX_TIMEOUT),
      );
    }
    schedule();

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [prefs]);

  return null;
}
