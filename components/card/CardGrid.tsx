"use client";

import { useRef, useState } from "react";
import { CardTile } from "./CardTile";
import { CardDetailModal, type CardDetailData } from "./CardDetailModal";

/** Grilla de álbum con un único `<dialog>` compartido (en vez de uno por carta): con
 * decenas de cartas, un `<dialog>` nativo por tile es innecesario y pesado. El modal
 * queda siempre montado (cerrado) para que el ref esté listo desde el primer click. */
export function CardGrid({ cards, lang }: { cards: CardDetailData[]; lang: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState(cards[0]?.id);
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];

  function open(card: CardDetailData) {
    setSelectedId(card.id);
    dialogRef.current?.showModal();
  }

  if (cards.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c) => (
          <CardTile key={c.id} card={c} lang={lang} onOpen={open} />
        ))}
      </div>
      <CardDetailModal ref={dialogRef} card={selected} lang={lang} />
    </>
  );
}
