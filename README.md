# WordGrow

WordGrow es una app para estudiar vocabulario con mazos propios y repaso espaciado. Cada término se convierte en una carta coleccionable que sube de rango a medida que lo practicás. El arte abstracto de cada carta se genera a partir del término, por lo que siempre conserva el mismo diseño.

## Funciones

- **Cuentas locales:** registro e inicio de sesión, con mazos, progreso y ajustes separados por persona.
- **Mazos y cartas:** palabras, frases, phrasal verbs y otras expresiones con significado, ejemplo, notas y tipo. Podés cargar cartas a mano, pegar una lista o importar archivos CSV, TSV y TXT. Hay un mazo de ejemplo para empezar.
- **Estudio:** sesiones con cartas pendientes, nuevas, difíciles o de todos los mazos. Incluye opciones múltiples, escritura, completar oraciones, tarjetas para dar vuelta y un modo mixto. Podés elegir los mazos, la cantidad de preguntas y guardar la configuración.
- **Repaso espaciado:** cinco rangos, de novato a experto. Los aciertos suben la carta de rango y espacian el próximo repaso; los errores la hacen retroceder y la vuelven a programar.
- **Seguimiento:** meta diaria, rachas, actividad de las últimas 12 semanas, aciertos por mazo y cartas difíciles.
- **Audio:** pronunciación con las voces del navegador mediante Web Speech API, con selección de voz, velocidad y reproducción automática opcional.
- **Atajos de teclado:** `1` a `4` para responder, `Enter` para continuar, `Espacio` para dar vuelta una tarjeta, `S` para escuchar y `?` para ver la ayuda.
- **Ajustes y datos:** tema claro, oscuro o automático; exportación y restauración de backups JSON desde Ajustes.
- **Instalación y recordatorios:** manifest y service worker para instalar la app donde el navegador lo permita. Los recordatorios se configuran por días y horario, y se muestran mientras WordGrow permanece abierto.

## Inicio rápido

Necesitás Node.js 24 o posterior, npm y una base de datos Postgres en [Neon](https://neon.tech) (tiene un plan gratuito).

Creá un proyecto en Neon y copiá `.env.example` a `.env` con sus dos connection strings: `DATABASE_URL` (pooled, la usa la app) y `DIRECT_URL` (directa, la usan las migraciones).

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

`db:seed` crea dos cuentas de prueba: `demo@wordgrow.dev` (con mazos, cartas en distintos rangos y una racha de repasos) y `nuevo@wordgrow.dev` (sin mazos, para probar la bienvenida). Ambas usan la contraseña `wordgrow123`.

Abrí [http://localhost:3000](http://localhost:3000) y entrá con alguna de esas cuentas, o registrá la tuya y creá un mazo o agregá el mazo de ejemplo. También podés importar una lista desde la página de un mazo. Por ejemplo:

```text
give up - rendirse
look after; cuidar; She looks after her brother.
break the ice = romper el hielo
```

La importación admite tabulaciones, punto y coma, comas, ` - ` o ` = ` como separadores. Las columnas opcionales van en este orden: término, significado, ejemplo, notas y tipo.

## Datos y backups

Los datos viven en Postgres (Neon), no en la máquina donde corre el servidor. En **Ajustes** podés descargar un backup JSON de tu cuenta o restaurarlo. La restauración reemplaza los mazos, el progreso, el historial y los ajustes de esa cuenta.

## Comandos

| Comando | Acción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera la versión de producción. |
| `npm start` | Sirve la versión de producción después de `build`. |
| `npm test` | Ejecuta las pruebas con Vitest (contra el branch de Neon de `.env.test`). |
| `npm run lint` | Ejecuta ESLint. |
| `npm run db:migrate` | Aplica las migraciones de Prisma en desarrollo. |
| `npm run db:deploy` | Aplica las migraciones pendientes en producción. |
| `npm run db:seed` | Recrea las cuentas de prueba. |
| `npm run db:reset` | Borra todo y vuelve a aplicar las migraciones. |
| `npm run db:studio` | Abre Prisma Studio para explorar la base. |

## Stack

Next.js 16 (App Router, Server Actions y Proxy), React 19, TypeScript, Tailwind CSS 4, React Hook Form, Zod, Prisma y PostgreSQL (Neon).

## Limitaciones y próximos pasos

El service worker guarda una base de la interfaz para navegación sin conexión, pero las funciones que consultan la base requieren el servidor. Los recordatorios no usan Web Push: no llegan si el navegador o la app están cerrados. Tampoco hay sincronización entre dispositivos. Las ideas futuras están en [docs/ideas-futuras.md](docs/ideas-futuras.md).
