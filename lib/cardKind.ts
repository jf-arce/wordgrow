import type { CardKind } from "@/lib/quiz";

/** Color de badge por tipo de carta (glifo en `components/card/KindGlyph.tsx`). */
export const KIND_STYLE: Record<CardKind, { soft: string; ink: string }> = {
  word: { soft: "bg-azure-soft", ink: "text-azure-strong" },
  phrasal_verb: { soft: "bg-sky-soft", ink: "text-sky-ink" },
  collocation: { soft: "bg-rose-soft", ink: "text-rose-ink" },
  sentence: { soft: "bg-lilac-soft", ink: "text-lilac-ink" },
  other: { soft: "bg-paper-2", ink: "text-ink-soft" },
};
