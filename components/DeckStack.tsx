import clsx from "clsx";
import { FoxSilhouette } from "@/components/brand/FoxSilhouette";
import { deckColor } from "@/components/ui/DeckColor";

export function DeckStack({ name, color, total, due, compact = false }: { name: string; color: string; total: number; due?: number; compact?: boolean }) {
  const c = deckColor(color);
  return (
    <div className={clsx("deck-stack", compact && "deck-stack-compact")} aria-hidden="true">
      <div className="deck-stack-sheet deck-stack-sheet-back" />
      <div className="deck-stack-sheet deck-stack-sheet-middle" />
      <div className={clsx("deck-stack-cover", c.soft)}>
        <span className="deck-stack-brand">WG</span>
        <FoxSilhouette className={clsx("deck-stack-fox", c.ink)} />
        <span className="deck-stack-name">{name}</span>
        {!compact && <span className="deck-stack-count">{total} {total === 1 ? "carta" : "cartas"}{due ? ` · ${due} pendientes` : ""}</span>}
      </div>
    </div>
  );
}
