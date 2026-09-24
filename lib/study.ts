/** Tipos y constantes de "de dónde salen las cartas a estudiar", sin nada server-only, para usar también en client components. */

export type StudySource = "due" | "all" | "hard" | "new";

export const SOURCE_LABELS: Record<StudySource, string> = {
  due: "Para repasar hoy",
  all: "Todas las cartas",
  hard: "Las difíciles",
  new: "Las nuevas",
};

/** Arma la URL de `/estudiar/sesion` para una selección dada. Misma forma en todos los
 * puntos de entrada (nav, dashboard) para que abran siempre la misma sesión. */
export function sessionHref(opts: { source: StudySource; mode: string; limit: number; deckIds: number[]; deckScope?: "all" | "selected" }): string {
  return `/estudiar/sesion?${new URLSearchParams({
    source: opts.source,
    mode: opts.mode,
    limit: String(opts.limit),
    ...(opts.deckScope === "selected" || (!opts.deckScope && opts.deckIds.length) ? { decks: opts.deckIds.join(",") } : {}),
  })}`;
}
