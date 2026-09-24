import { STAGES } from "@/lib/srs";
import { TiltedRankCard } from "./TiltedRankCard";

/** Resumen de la colección: una carta por rango, con su cantidad real en el centro. */
export function Collection({ stages }: { stages: number[] }) {
  const total = stages.reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <ul className="collection-ranks">
        {STAGES.map((rank) => {
          const count = stages[rank.stage] ?? 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;

          const content = (
            <>
              <div className="collection-rank-center">
                <strong className="collection-rank-count tabular-nums">{count}</strong>
                <span className="collection-rank-name">{count === 1 ? rank.name : rank.plural}</span>
              </div>

              <div className="collection-rank-bottom">
                <span>{percent}% de la colección</span>
                <div className="collection-rank-track" aria-hidden="true">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            </>
          );

          const className = `collection-rank-card collection-rank-${rank.stage}`;
          return (
            <li key={rank.stage} className={rank.stage === 4 ? "collection-rank-slot-featured" : undefined}>
              <TiltedRankCard className={className}>{content}</TiltedRankCard>
            </li>
          );
        })}
      </ul>
      {total === 0 && <p className="mt-3 text-sm text-ink-soft">Cuando cargues cartas, van a aparecer como novatas.</p>}
    </div>
  );
}
