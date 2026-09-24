"use client";

import { useId, useRef } from "react";
import { Plus, X } from "lucide-react";
import { AddCardForm } from "./AddCardForm";

export function AddCardDialog({ deckId }: { deckId: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => dialogRef.current?.showModal()}>
        <Plus size={18} aria-hidden />
        Agregar carta
      </button>
      <dialog ref={dialogRef} className="modal" aria-labelledby={titleId}>
        <div className="modal-box relative max-w-2xl">
          <button type="button" className="btn btn-sm btn-circle btn-ghost absolute top-3 right-3" aria-label="Cerrar" onClick={close}>
            <X size={16} aria-hidden />
          </button>
          <h2 id={titleId} className="mb-5 pr-10 text-2xl font-bold">Agregar una carta</h2>
          <AddCardForm deckId={deckId} onAdded={close} onCancel={close} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
        </form>
      </dialog>
    </>
  );
}
