"use client";

import { WordCard } from "./WordCard";
import { CardHover3D } from "./CardHover3D";
import type { CardDetailData } from "./CardDetailModal";

export function CardTile({ card, lang, onOpen }: { card: CardDetailData; lang: string; onOpen: (card: CardDetailData) => void }) {
  return (
    <button
      type="button"
      className="block w-full cursor-pointer rounded-2xl text-left focus-visible:outline-3 focus-visible:outline-(--focus) focus-visible:outline-offset-4"
      aria-haspopup="dialog"
      onClick={() => onOpen(card)}
    >
      <CardHover3D className="w-full">
        <WordCard term={card.term} stage={card.stage} kind={card.kind} lang={lang} reps={card.reps} size="full" due={card.due} />
      </CardHover3D>
    </button>
  );
}
