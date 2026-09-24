"use client";

import { useEffect, useRef } from "react";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: "1 – 4", desc: "Elegir una opción" },
  { keys: "Enter", desc: "Confirmar / Siguiente" },
  { keys: "Espacio", desc: "Dar vuelta la tarjeta" },
  { keys: "S", desc: "Escuchar la pronunciación" },
  { keys: "?", desc: "Mostrar esta ayuda" },
];

/** Botón "?" con los atajos de teclado de la sesión, para que se puedan descubrir. */
export function ShortcutsHelp() {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (!typing && e.key === "?") ref.current?.showModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-line text-ink-soft hover:bg-paper-2"
        aria-label="Ver atajos de teclado"
        onClick={() => ref.current?.showModal()}
      >
        <Keyboard size={16} aria-hidden />
      </button>
      <dialog
        ref={ref}
        aria-labelledby="shortcuts-title"
        className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-3xl border border-line bg-paper p-6 text-ink shadow-soft backdrop:bg-ink/40"
      >
        <h2 id="shortcuts-title" className="text-xl font-semibold">
          Atajos de teclado
        </h2>
        <dl className="mt-4 flex flex-col gap-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4">
              <dt>
                <kbd className="rounded-md bg-paper-2 px-2 py-1 font-mono text-sm">{s.keys}</kbd>
              </dt>
              <dd className="text-ink-soft">{s.desc}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="btn btn-quiet mt-6" onClick={() => ref.current?.close()}>
          Cerrar
        </button>
      </dialog>
    </>
  );
}
