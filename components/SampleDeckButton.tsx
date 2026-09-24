"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSampleDeckAction } from "@/app/actions/decks";

export function SampleDeckButton({ className = "btn btn-quiet btn-large" }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createSampleDeckAction();
            if (res.ok) router.push(`/mazos/${res.data.id}`);
            else setError(res.error);
          })
        }
      >
        {pending ? "Cargando…" : "Cargar mazo de ejemplo"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-berry-ink">
          {error}
        </p>
      )}
    </>
  );
}
