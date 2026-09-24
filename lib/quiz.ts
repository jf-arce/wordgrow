import { maskTerm, normalize, shuffle } from "./text";

export const CARD_KINDS = ["word", "phrasal_verb", "collocation", "sentence", "other"] as const;
export type CardKind = (typeof CARD_KINDS)[number];

export const KIND_LABELS: Record<CardKind, string> = {
  word: "Word",
  phrasal_verb: "Phrasal Verb",
  collocation: "Collocation",
  sentence: "Sentence",
  other: "Other",
};

/** Tipos que existieron antes de esta taxonomía (`idiom`, la vieja `phrase`) y a qué tipo
 * nuevo equivalen. Se usa en la migración de la base, en la restauración de backups viejos
 * y en la importación de CSV con la columna `kind` en valores viejos, para no tratarlos
 * como desconocidos y perder la clasificación explícita que traían. */
const LEGACY_KIND_MAP: Record<string, CardKind> = {
  idiom: "collocation",
  phrase: "collocation",
};

/** `null` si `value` no es ni un `CardKind` actual ni uno de los tipos legacy conocidos. */
export function migrateLegacyKind(value: string): CardKind | null {
  if ((CARD_KINDS as readonly string[]).includes(value)) return value as CardKind;
  return LEGACY_KIND_MAP[value] ?? null;
}

/** Sugerencia editable para precargar el tipo al crear una carta — el usuario siempre
 * puede corregirla en el radiogroup de `CardEditor` antes de guardar, así que no busca
 * ser una heurística lingüística perfecta, solo un punto de partida razonable. */
export function guessKind(term: string): CardKind {
  const words = term.trim().split(/\s+/);
  if (words.length === 1) return "word";
  if (words.length === 2 && /^(up|down|out|in|on|off|over|away|back|around|through|about|along|apart|by|for|into|with)$/i.test(words[1])) {
    return "phrasal_verb";
  }
  if (words.length <= 4) return "collocation";
  return "sentence";
}

export type QuizMode = "choice" | "reverse" | "typed" | "cloze" | "flashcard";
export type StudyMode = QuizMode | "mixed";

export const MODE_LABELS: Record<StudyMode, string> = {
  mixed: "Mixto",
  choice: "Elegir el significado",
  reverse: "Elegir la palabra",
  typed: "Escribir la palabra",
  cloze: "Completar la oración",
  flashcard: "Tarjetas",
};

export type QuizCard = {
  id: number;
  deckId: number;
  term: string;
  meaning: string;
  example: string;
  kind: CardKind;
  stage: number;
  lang: string;
};

export type QuizOption = { id: number; text: string };

export type QuizItem = {
  cardId: number;
  mode: QuizMode;
  lang: string;
  /** Rango actual de la carta, para mostrar cómo sube al responder. */
  stage: number;
  term: string;
  meaning: string;
  example: string;
  /** Texto principal de la pregunta. */
  prompt: string;
  /** Respuesta correcta como texto. */
  answer: string;
  options?: QuizOption[];
  correctOptionId?: number;
};

/** Elige los distractores: mismo mazo y mismo tipo primero, con longitud parecida. */
export function pickDistractors(
  target: QuizCard,
  pool: readonly QuizCard[],
  field: "meaning" | "term",
  count = 3,
  random: () => number = Math.random,
): QuizCard[] {
  const correct = normalize(target[field]);
  const seen = new Set<string>([correct]);
  const candidates = pool.filter((c) => {
    if (c.id === target.id) return false;
    const key = normalize(c[field]);
    if (c.lang !== target.lang || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const targetLen = target[field].length;
  const score = (c: QuizCard) =>
    (c.deckId === target.deckId ? 0 : 1000) +
    (c.kind === target.kind ? 0 : 500) +
    Math.abs(c[field].length - targetLen) +
    random() * 20;

  return candidates
    .map((c) => ({ c, s: score(c) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, count)
    .map((x) => x.c);
}

function pickMode(card: QuizCard, mode: StudyMode, random: () => number): QuizMode {
  if (mode !== "mixed") return mode;
  if (card.stage <= 1) return "choice";
  if (card.stage === 2) return "reverse";
  const canCloze = maskTerm(card.example, card.term) !== null;
  return canCloze && random() < 0.5 ? "cloze" : "typed";
}

/** Arma un ítem de quiz. El llamador filtra previamente cartas incompatibles. */
export function buildItem(
  card: QuizCard,
  pool: readonly QuizCard[],
  mode: StudyMode,
  random: () => number = Math.random,
): QuizItem {
  const base = {
    cardId: card.id,
    lang: card.lang,
    stage: card.stage,
    term: card.term,
    meaning: card.meaning,
    example: card.example,
  };
  let chosen = pickMode(card, mode, random);

  if (chosen === "cloze" && maskTerm(card.example, card.term) === null) {
    chosen = "typed";
  }

  if (chosen === "choice" || chosen === "reverse") {
    const field = chosen === "choice" ? "meaning" : "term";
    const distractors = pickDistractors(card, pool, field, 3, random);
    if (distractors.length < 1) {
      chosen = "typed";
    } else {
      const options = shuffle(
        [card, ...distractors].map((c) => ({ id: c.id, text: c[field] })),
        random,
      );
      return {
        ...base,
        mode: chosen,
        prompt: chosen === "choice" ? card.term : card.meaning,
        answer: card[field],
        options,
        correctOptionId: card.id,
      };
    }
  }

  if (chosen === "cloze") {
    return {
      ...base,
      mode: "cloze",
      prompt: maskTerm(card.example, card.term) ?? card.meaning,
      answer: card.term,
    };
  }

  if (chosen === "typed") {
    return { ...base, mode: "typed", prompt: card.meaning, answer: card.term };
  }

  return { ...base, mode: "flashcard", prompt: card.term, answer: card.meaning };
}

export function canBuildItem(card: QuizCard, pool: readonly QuizCard[], mode: StudyMode): boolean {
  if (mode === "cloze") return maskTerm(card.example, card.term) !== null;
  if (mode === "choice" || mode === "reverse") return pickDistractors(card, pool, mode === "choice" ? "meaning" : "term", 1).length > 0;
  return true;
}
