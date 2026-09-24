import type { CardKind } from "@/lib/quiz";

/**
 * Glifos con forma de carta coleccionable (misma silueta con esquina doblada que
 * `RankBadge`), uno por tipo de carta — reemplazan los íconos genéricos de lucide en
 * `lib/cardKind.ts`. Dibujados con `currentColor` para heredar el color del badge.
 */
export function KindGlyph({ kind, size = 16, className }: { kind: CardKind; className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 64"
      width={(size * 48) / 64}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Silueta de carta compartida, sin relleno propio (hereda currentColor con opacidad baja). */}
      <path
        d="M4 6 C4 3.8 5.8 2 8 2 H32 L44 14 V58 C44 60.2 42.2 62 40 62 H8 C5.8 62 4 60.2 4 58 Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M32 2 L32 14 L44 14 Z" fill="currentColor" opacity="0.35" />
      {GLYPH_MARK[kind]}
    </svg>
  );
}

const GLYPH_MARK: Record<CardKind, React.ReactNode> = {
  // word: una letra serif marcada, centrada.
  word: (
    <text x="24" y="42" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" fill="currentColor">
      Aa
    </text>
  ),
  // phrasal_verb: una flecha que se quiebra al salir (verbo + partícula).
  phrasal_verb: (
    <path
      d="M11 24 H26 V17 L38 30 L26 43 V36 H11 Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  ),
  // collocation: destello, palabras que "encajan" de forma no del todo predecible.
  collocation: (
    <path
      d="M24 16 L27.6 27.2 L39 27.4 L29.8 34.4 L33.2 45.6 L24 38.6 L14.8 45.6 L18.2 34.4 L9 27.4 L20.4 27.2Z"
      fill="currentColor"
    />
  ),
  // sentence: dos comillas tipográficas, cita/ejemplo completo.
  sentence: (
    <g fill="currentColor">
      <path d="M14 26c-3.5 0-6 2.8-6 6.3 0 3.4 2.4 6 5.6 6 .6 3.6-1.4 6.7-5 8.2l1.6 3.1c5.6-2 9-6.6 9-12.7 0-6.2-2.5-10.9-5.2-10.9Z" />
      <path d="M32 26c-3.5 0-6 2.8-6 6.3 0 3.4 2.4 6 5.6 6 .6 3.6-1.4 6.7-5 8.2l1.6 3.1c5.6-2 9-6.6 9-12.7 0-6.2-2.5-10.9-5.2-10.9Z" />
    </g>
  ),
  // other: carta en blanco (sólo el pliegue de la esquina se destaca).
  other: (
    <>
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <circle cx="24" cy="38" r="3" fill="currentColor" />
    </>
  ),
};
