// Service worker mínimo: notificaciones de recordatorio + shell offline básico.
// No hay Web Push (VAPID) todavía, así que esto sólo dispara notificaciones mientras la
// pestaña/PWA sigue abierta (ver components/pwa/ReminderTimer.tsx). Queda anotado en
// docs/ideas-futuras.md como mejora futura.

const SHELL_CACHE = "wordgrow-shell-v1";
const SHELL_URLS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Sólo navegaciones (documentos HTML): red primero, shell cacheado como respaldo offline.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((res) => res || caches.match("/"))),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_REMINDER") {
    self.registration.showNotification(event.data.title ?? "WordGrow", {
      body: event.data.body ?? "Hoy te toca practicar.",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag: "wordgrow-reminder",
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/estudiar");
    }),
  );
});
