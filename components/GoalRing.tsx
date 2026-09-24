/** Anillo de la meta diaria, con el `radial-progress` de daisyUI. */
export function GoalRing({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, goal > 0 ? Math.round((value / goal) * 100) : 0);
  const reached = value >= goal;
  return (
    <div className="flex items-center gap-4">
      {/* daisyUI dibuja el arco cumplido con currentColor pero deja el resto del anillo
          transparente (piensa que el track se nota por el fondo detrás) — sobre un fondo
          oscuro eso hace que el aro "vacío" desaparezca. Se agrega un aro de base fijo
          (mismo grid cell) para que siempre haya un círculo visible detrás del progreso. */}
      <div className="grid size-20">
        <div aria-hidden className="col-start-1 row-start-1 size-20 rounded-full border-[9px] border-line" />
        <div
          role="img"
          aria-label={`${value} de ${goal} repasos hoy`}
          className="radial-progress col-start-1 row-start-1 font-display font-extrabold"
          style={
            {
              "--value": pct,
              "--size": "5rem",
              "--thickness": "9px",
              color: reached ? "var(--color-accent)" : "var(--color-primary)",
            } as React.CSSProperties
          }
        >
          {pct}%
        </div>
      </div>
      <div>
        <p className="font-semibold">Meta de hoy</p>
        <p className="text-ink-soft">{reached ? "¡Meta cumplida!" : `${value} de ${goal} repasos`}</p>
      </div>
    </div>
  );
}
