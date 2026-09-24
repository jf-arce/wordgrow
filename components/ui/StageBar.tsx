import { STAGES, stageCount } from "@/lib/srs";

/** Rampa de un solo tono: cuanto más alto el rango, más intenso el azul. */
const STAGE_MIX = [0, 30, 55, 78, 100];

/** Distribución de tarjetas por etapa como una barra segmentada. */
export function StageBar({ stages, className = "" }: { stages: number[]; className?: string }) {
  const total = stages.reduce((a, b) => a + b, 0);
  const summary = total
    ? STAGES.filter((s) => stages[s.stage] > 0)
        .map((s) => stageCount(s.stage, stages[s.stage]))
        .join(", ")
    : "Sin palabras";
  return (
    <div
      role="img"
      aria-label={summary}
      className={`flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-paper-2 ${className}`}
    >
      {total > 0 &&
        stages.map((n, stage) =>
          n > 0 ? (
            <span
              key={stage}
              className="stage-bar-segment"
              style={{
                width: `${(n / total) * 100}%`,
                background:
                  stage === 0 ? "var(--color-line)" : `color-mix(in oklab, var(--color-azure) ${STAGE_MIX[stage]}%, var(--color-paper))`,
              }}
            />
          ) : null,
        )}
    </div>
  );
}
