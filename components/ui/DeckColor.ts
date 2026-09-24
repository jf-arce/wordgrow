import type { DeckColor } from "@/lib/schemas";

/** Clases por color de mazo (fondo suave + tinta legible). */
export const DECK_COLOR_CLASSES: Record<DeckColor, { soft: string; dot: string; ink: string }> = {
  leaf: { soft: "bg-azure-soft", dot: "bg-azure", ink: "text-azure-strong" },
  sun: { soft: "bg-gold-soft", dot: "bg-gold", ink: "text-gold-ink" },
  lilac: { soft: "bg-lilac-soft", dot: "bg-lilac", ink: "text-lilac-ink" },
  sky: { soft: "bg-sky-soft", dot: "bg-sky", ink: "text-ink" },
  rose: { soft: "bg-rose-soft", dot: "bg-rose", ink: "text-ink" },
};

export function deckColor(color: string) {
  return DECK_COLOR_CLASSES[(color as DeckColor) in DECK_COLOR_CLASSES ? (color as DeckColor) : "leaf"];
}
