"use client";

/**
 * Store externo para la Web Speech API. `synth.getVoices()` devuelve `[]` hasta que el
 * navegador dispara `voiceschanged`, y sin suscribirse a ese evento el botón de audio
 * queda mudo la primera vez (o para siempre, en navegadores lentos para cargar voces).
 */

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedVoices: SpeechSynthesisVoice[] = [];
const emptyVoices: SpeechSynthesisVoice[] = [];
let subscribed = false;

function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function refresh() {
  if (!canSpeak()) return;
  cachedVoices = window.speechSynthesis.getVoices();
  listeners.forEach((l) => l());
}

function ensureSubscribed() {
  if (subscribed || !canSpeak()) return;
  subscribed = true;
  refresh();
  window.speechSynthesis.addEventListener("voiceschanged", refresh);
}

export function subscribeVoices(listener: Listener): () => void {
  ensureSubscribed();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVoicesSnapshot(): SpeechSynthesisVoice[] {
  return cachedVoices;
}

export function getVoicesServerSnapshot(): SpeechSynthesisVoice[] {
  return emptyVoices;
}

/** Voces cuyo idioma (o prefijo, "en" para "en-US") coincide con `lang`. */
export function voicesFor(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice[] {
  const short = lang.split("-")[0].toLowerCase();
  return voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(short));
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string, preferredName: string): SpeechSynthesisVoice | undefined {
  if (preferredName) {
    const byName = voices.find((v) => v.name === preferredName);
    if (byName) return byName;
  }
  const exact = voices.find((v) => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  return voicesFor(voices, lang)[0];
}

export type SpeakOptions = { slow?: boolean; voiceName?: string; onError?: (message: string) => void };

let resumeTimer: ReturnType<typeof setInterval> | null = null;

/** Chrome corta la locución a los ~15s si no se le pide `resume()` periódicamente. */
function keepAlive() {
  if (resumeTimer) return;
  resumeTimer = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      if (resumeTimer) clearInterval(resumeTimer);
      resumeTimer = null;
      return;
    }
    window.speechSynthesis.resume();
  }, 5000);
}

export function speak(text: string, lang: string, rate: number, opts: SpeakOptions = {}): void {
  if (!canSpeak()) {
    opts.onError?.("Este navegador no puede leer en voz alta.");
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  // Encadenar cancel() + speak() en el mismo tick hace que algunos navegadores descarten
  // la locución en silencio; un tick de por medio evita esa carrera.
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = opts.slow ? Math.min(rate, 0.6) : rate;
    const voice = pickVoice(synth.getVoices(), lang, opts.voiceName ?? "");
    if (voice) utterance.voice = voice;
    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        opts.onError?.("No se pudo reproducir el audio.");
      }
    };
    synth.speak(utterance);
    keepAlive();
  }, 0);
}
