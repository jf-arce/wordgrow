# Ideas futuras de WordGrow

Ideas fuera de la v1. Se agregan acá a medida que aparecen.

## IA (Claude)
- Pegar una lista de palabras y autocompletar significado, ejemplo, traducción y distractores plausibles.

## Profe y alumnos
- Compartir mazos por link o código.
- Que el profe vea el progreso de cada alumno.

## Cuentas y sincronización
- Sync en la nube (Supabase o Turso, que se lleva bien con SQLite). El login local con cuentas propias ya está.

## PWA y recordatorios
- Ya está: manifest, service worker básico con shell offline, y recordatorios programados
  mientras la app/PWA sigue abierta (`components/pwa/ReminderTimer.tsx`).
- **Pendiente:** Web Push real con claves VAPID. Sin eso, el recordatorio no llega si el
  navegador está cerrado del todo — sólo funciona con alguna pestaña o la PWA abierta.
  Necesita generar claves VAPID, sumar la librería `web-push`, guardar la suscripción por
  usuario, y servir la app por HTTPS (no alcanza con `localhost`).
- Íconos del manifest en SVG por ahora; convendría sumar PNG para los navegadores que
  todavía no soportan íconos SVG en el manifest.

## Pronunciación
- Decir la palabra y que la app la evalúe (Web Speech Recognition).

## Más contenido en la tarjeta
- Imagen, sinónimos y antónimos, collocations, nivel CEFR.
- Etiquetas por clase o unidad.

## Juegos
- Unir parejas contra reloj.
- Dictado.
- Sprint de 60 segundos.

## Motivación
- Logros e insignias.
- Colección compartible.
- Protector de racha.

## Del rediseño del dashboard/álbum (sept. 2026)
Quedaron afuera del alcance de esa tanda, anotadas para después:
- **Apertura de sobres:** al importar o agregar varias cartas, animación de sobre que se
  abre y revela las cartas nuevas una a una. El arte ya se genera por término, así que es
  puro CSS.
- **Álbum con huecos:** mostrar las cartas que todavía no llegaron a experto como
  siluetas apagadas que se "revelan" al dominarlas — el gancho clásico del álbum de
  figuritas, y encaja con la grilla de cartas del mazo.
- **Misiones diarias:** tres objetivos rotativos (repasá 10, acertá 5 seguidas, subí una
  carta de rango) como un tile más del dashboard.
- **XP y nivel de usuario** aparte del rango por carta, con barra en el sidebar.
- **Duelo del día:** sesión especial contra reloj con las cartas más difíciles.
