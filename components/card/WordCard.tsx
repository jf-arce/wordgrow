import clsx from "clsx";
import { stageInfo } from "@/lib/srs";
import { KIND_LABELS, type CardKind } from "@/lib/quiz";
import { KIND_STYLE } from "@/lib/cardKind";
import { CardArt } from "./CardArt";
import { CardFrame } from "./CardFrame";
import { KindGlyph } from "./KindGlyph";

export type WordCardSize = "mini" | "small" | "full";

export type WordCardProps = {
  term: string;
  stage: number;
  kind?: CardKind;
  lang?: string;
  /** Cantidad de aciertos a mostrar en el pie de la carta (tamaño "full"). */
  reps?: number;
  size?: WordCardSize;
  className?: string;
  /** Cuando se pasa, la carta queda accesible como imagen con esa etiqueta (decorativa si se omite). */
  title?: string;
  /** Punto rojo en la esquina: la carta ya está vencida para repasar. */
  due?: boolean;
};

const SIZE_CLASS: Record<WordCardSize, string> = {
  mini: "aspect-[5/7] w-11",
  small: "aspect-[5/7] w-24",
  full: "aspect-[5/7] w-full max-w-56",
};

/**
 * La carta coleccionable de una palabra: marco según el rango, arte generado del
 * término, y (en tamaño completo) tipo y estadísticas. Es el componente central de la
 * identidad visual — sustituye al viejo blasón de escudo.
 */
export function WordCard({ term, stage, kind, lang, reps, size = "small", className, title, due }: WordCardProps) {
  const info = stageInfo(stage);
  const showText = size !== "mini";
  const showStats = size === "full";

  return (
    <CardFrame
      stage={stage}
      className={clsx("word-card", SIZE_CLASS[size], "flex flex-col overflow-hidden p-1", due && "due", className)}
    >
      <div role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className="word-card-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.65rem] p-1">
        {showText && (
          <p className="mb-1 flex items-center justify-between px-0.5 text-[0.6875rem] font-bold tracking-wide text-ink-soft uppercase">
            <span>{info.name}</span>
          </p>
        )}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md">
          <CardArt term={term} className="absolute inset-0 h-full w-full" />
        </div>
        {showText && (
          <div className="px-0.5 pt-1.5">
            <p className={clsx("truncate font-display font-extrabold text-ink", size === "full" ? "text-lg" : "text-xs")} lang={lang?.split("-")[0]}>
              {term}
            </p>
            {showStats && (
              <div className="mt-1 flex items-center justify-between gap-1 border-t border-line pt-1 text-xs text-ink-soft">
                {kind ? (
                  <span className={clsx("flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold", KIND_STYLE[kind].soft, KIND_STYLE[kind].ink)}>
                    <KindGlyph kind={kind} size={11} />
                    {KIND_LABELS[kind]}
                  </span>
                ) : (
                  <span>{info.name}</span>
                )}
                {reps !== undefined && <span className="font-semibold tabular-nums">♦ {reps}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </CardFrame>
  );
}
