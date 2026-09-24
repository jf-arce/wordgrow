"use client";

import { useId, useRef, useState, type ReactNode } from "react";

/** Botón que pide confirmación en un diálogo nativo (con trampa de foco y Esc incluidos). */
export function ConfirmButton({
  children,
  title,
  description,
  confirmLabel,
  onConfirm,
  className = "btn btn-danger btn-small",
  ariaLabel,
}: {
  children: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      ref.current?.close();
    }
  }

  return (
    <>
      <button type="button" className={className} aria-label={ariaLabel} onClick={() => ref.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-3xl border border-line bg-paper p-6 text-ink shadow-soft backdrop:bg-ink/40"
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-ink-soft">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-quiet" onClick={() => ref.current?.close()}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={confirm}>
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
