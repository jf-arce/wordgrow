"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function GoogleSignInButton({ callbackURL }: { callbackURL: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      <button
        type="button"
        className="btn btn-quiet btn-large gap-2"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError("");
          try {
            const result = await authClient.signIn.social({ provider: "google", callbackURL });
            if (result.error) setError("No pudimos iniciar sesión con Google. Probá de nuevo.");
          } catch {
            setError("No pudimos iniciar sesión con Google. Probá de nuevo.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <GoogleIcon />
        Continuar con Google
      </button>
      {error && <p role="alert" className="font-medium text-berry-ink">{error}</p>}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.9 0-12.5-5.6-12.5-12.5S17.1 10.5 24 10.5c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.1 5.6 29.3 3.6 24 3.6 12.9 3.6 3.9 12.6 3.9 23.7S12.9 43.8 24 43.8c11.1 0 20.1-9 20.1-20.1 0-1.1-.1-2.1-.3-3.2Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 5.9 4.3C13.9 15.4 18.6 12.5 24 12.5c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.1 7.6 29.3 5.6 24 5.6c-7.6 0-14.2 4.3-17.7 10.6Z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.8c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.3c-2 1.5-4.6 2.4-7.3 2.4-5.3 0-9.7-3.4-11.3-8l-6.1 4.7c3.4 6.7 10.3 11.3 17.4 11.3Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.3c-.4.4 6.6-4.8 6.6-14.9 0-1.1-.1-2.1-.4-3.6Z"
      />
    </svg>
  );
}
