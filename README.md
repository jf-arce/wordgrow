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

Necesitás Node.js 24 o posterior y npm. La app usa `node:sqlite`, incluido en Node.js.

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000), registrá una cuenta y creá un mazo o agregá el mazo de ejemplo. También podés importar una lista desde la página de un mazo. Por ejemplo:

```text
give up - rendirse
look after; cuidar; She looks after her brother.
break the ice = romper el hielo
```

La importación admite tabulaciones, punto y coma, comas, ` - ` o ` = ` como separadores. Las columnas opcionales van en este orden: término, significado, ejemplo, notas y tipo.

## Datos y backups

La base SQLite se crea automáticamente en `data/wordgrow.db`. Esa carpeta está ignorada por git. Para usar otra ubicación, definí `WORDGROW_DB` con la ruta completa del archivo:

```bash
WORDGROW_DB=/ruta/wordgrow.db npm run dev
```

Los datos quedan en la computadora donde corre el servidor. En **Ajustes** podés descargar un backup JSON de tu cuenta o restaurarlo. La restauración reemplaza los mazos, el progreso, el historial y los ajustes de esa cuenta.

## Comandos

| Comando | Acción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera la versión de producción. |
| `npm start` | Sirve la versión de producción después de `build`. |
| `npm test` | Ejecuta las pruebas con Vitest. |
| `npm run lint` | Ejecuta ESLint. |

## Stack

Next.js 16 (App Router, Server Actions y Proxy), React 19, TypeScript, Tailwind CSS 4, React Hook Form, Zod y SQLite (`node:sqlite`).

## Limitaciones y próximos pasos

El service worker guarda una base de la interfaz para navegación sin conexión, pero las funciones que consultan la base requieren el servidor. Los recordatorios no usan Web Push: no llegan si el navegador o la app están cerrados. Tampoco hay sincronización entre dispositivos. Las ideas futuras están en [docs/ideas-futuras.md](docs/ideas-futuras.md).
