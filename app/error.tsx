"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-3xl font-extrabold">Algo se rompió</h1>
      <p className="text-ink-soft">
        Pasó un error inesperado. Podés intentar de nuevo o volver a Estudiar; tu progreso ya guardado no se pierde.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Intentar de nuevo
        </button>
        <Link href="/" className="btn btn-quiet">
          Volver a Estudiar
        </Link>
      </div>
    </div>
  );
}
