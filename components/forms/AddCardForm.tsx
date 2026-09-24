"use client";

import { useRouter } from "next/navigation";
import { createCardAction } from "@/app/actions/cards";
import { CardEditor } from "./CardEditor";

export function AddCardForm({ deckId, onAdded, onCancel }: { deckId: number; onAdded?: () => void; onCancel?: () => void }) {
  const router = useRouter();
  return (
    <CardEditor
      idPrefix="new-card"
      submitLabel="Agregar carta"
      autoFocus
      onCancel={onCancel}
      onSuccess={onAdded}
      onSubmit={async (values) => {
        const res = await createCardAction(deckId, values);
        if (!res.ok) return res.error;
        router.refresh();
        return null;
      }}
    />
  );
}
