"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Turtle, Volume2, VolumeX } from "lucide-react";
import { getVoicesServerSnapshot, getVoicesSnapshot, speak, subscribeVoices, voicesFor } from "@/lib/speech";

const subscribeSupport = () => () => {};
const getBrowserSupport = () => typeof window !== "undefined" && "speechSynthesis" in window;
const getServerSupport = () => false;

/** Todas las voces del navegador, actualizadas en cuanto terminan de cargar. */
export function useVoices(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscribeVoices, getVoicesSnapshot, getVoicesServerSnapshot);
}

/** Pronuncia `text` con la voz del navegador. */
export function useSpeech(lang: string, rate = 0.9, voiceName = "") {
  const voices = useVoices();
  const supported = useSyncExternalStore(subscribeSupport, getBrowserSupport, getServerSupport);
  const hasVoiceFor = voicesFor(voices, lang).length > 0;
  const [error, setError] = useState<string | null>(null);

  const doSpeak = useCallback(
    (text: string, opts?: { slow?: boolean }) => {
      setError(null);
      speak(text, lang, rate, { slow: opts?.slow, voiceName, onError: setError });
    },
    [lang, rate, voiceName],
  );

  return { supported, hasVoiceFor, speak: doSpeak, error };
}

export function SpeakButton({
  text,
  lang,
  rate,
  voiceName = "",
  withSlow = false,
  className = "",
}: {
  text: string;
  lang: string;
  rate?: number;
  voiceName?: string;
  withSlow?: boolean;
  className?: string;
}) {
  const { supported, hasVoiceFor, speak, error } = useSpeech(lang, rate, voiceName);
  if (!supported) return null;

  const base =
    "grid size-11 place-items-center rounded-full border-2 border-line text-ink transition-colors hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

  if (!hasVoiceFor) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`${base} cursor-not-allowed`} aria-hidden>
          <VolumeX size={20} />
        </span>
        <span className="text-sm text-ink-soft">
          Tu navegador no tiene una voz instalada para “{lang}”. Revisá las voces del sistema.
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button type="button" className={base} onClick={() => speak(text)} aria-label={`Escuchar “${text}”`}>
        <Volume2 size={20} aria-hidden />
      </button>
      {withSlow && (
        <button
          type="button"
          className={base}
          onClick={() => speak(text, { slow: true })}
          aria-label={`Escuchar “${text}” más despacio`}
        >
          <Turtle size={20} aria-hidden />
        </button>
      )}
      {error && (
        <span role="alert" className="text-sm font-medium text-berry-ink">
          {error}
        </span>
      )}
    </span>
  );
}
