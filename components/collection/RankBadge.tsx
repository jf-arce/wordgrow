import { MAX_STAGE, stageInfo } from "@/lib/srs";

/** Color del marco por rango: mate → bronce → plata → oro → diamante (experto). */
const FRAME_VARS = [
  "var(--frame-matte)",
  "var(--frame-bronze)",
  "var(--frame-silver)",
  "var(--frame-gold)",
  "var(--frame-holo-3)",
];

/**
 * Mini-carta que representa un rango (sin arte propio: se usa para grupos de tarjetas,
 * no para una palabra puntual — para eso está `WordCard`). Misma forma de carta
 * coleccionable que el resto de la app, en miniatura.
 */
export function RankBadge({
  stage,
  size = 48,
  className,
  title,
}: {
  stage: number;
  size?: number;
  className?: string;
  /** Si se pasa, el blasón es informativo; si no, es decorativo. */
  title?: string;
}) {
  const s = Math.min(Math.max(Math.round(stage), 0), MAX_STAGE);
  const isMax = s === MAX_STAGE;
  const frame = FRAME_VARS[s];
  const fill = s === 0 ? "var(--color-paper-2)" : `color-mix(in oklab, ${frame} 35%, var(--color-paper))`;

  return (
    <svg
      viewBox="0 0 48 64"
      width={(size * 48) / 64}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {/* Silueta de carta con la esquina doblada, como una carta coleccionable real. */}
      <path
        d="M4 6 C4 3.8 5.8 2 8 2 H32 L44 14 V58 C44 60.2 42.2 62 40 62 H8 C5.8 62 4 60.2 4 58 Z"
        fill={fill}
        stroke={frame}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M32 2 L32 14 L44 14 Z" fill={frame} opacity="0.5" />
      {isMax ? (
        <g stroke="var(--frame-holo-3)" strokeLinejoin="round">
          <path d="M16 22 H32 L37 28 L24 43 L11 28 Z" fill="var(--frame-holo-1)" strokeWidth="1.5" />
          <path d="M11 28 H37 M16 22 L20 28 L24 43 L28 28 L32 22" fill="none" strokeWidth="1" />
        </g>
      ) : (
        Array.from({ length: s }, (_, i) => (
          <circle key={i} cx={14 + i * 10} cy={44} r="3" fill={frame} />
        ))
      )}
    </svg>
  );
}

export function rankLabel(stage: number) {
  return stageInfo(stage).name;
}
