import { cardArt, type ArtPattern } from "@/lib/cardArt";

/** Genera las formas del patrón dentro de un viewBox de 100x100. */
function shapes(pattern: ArtPattern, density: number): { d?: string; cx?: number; cy?: number; r?: number }[] {
  const items: { d?: string; cx?: number; cy?: number; r?: number }[] = [];
  const step = 100 / density;

  if (pattern === "diamonds") {
    for (let y = 0; y < density; y++) {
      for (let x = 0; x < density; x++) {
        if ((x + y) % 2 !== 0) continue;
        const cx = x * step + step / 2;
        const cy = y * step + step / 2;
        const r = step * 0.32;
        items.push({ d: `M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z` });
      }
    }
  } else if (pattern === "waves") {
    for (let y = 0; y <= density; y++) {
      const cy = (y / density) * 100;
      items.push({ d: `M0,${cy} Q25,${cy - step / 2} 50,${cy} T100,${cy}` });
    }
  } else if (pattern === "rays") {
    const cx = 50;
    const cy = 50;
    for (let i = 0; i < density * 2; i++) {
      const a1 = (i / (density * 2)) * Math.PI * 2;
      const a2 = a1 + Math.PI / (density * 2);
      const x1 = cx + Math.cos(a1) * 70;
      const y1 = cy + Math.sin(a1) * 70;
      const x2 = cx + Math.cos(a2) * 70;
      const y2 = cy + Math.sin(a2) * 70;
      if (i % 2 === 0) items.push({ d: `M${cx},${cy} L${x1},${y1} L${x2},${y2} Z` });
    }
  } else if (pattern === "cells") {
    for (let y = 0; y < density; y++) {
      for (let x = 0; x < density; x++) {
        const cx = x * step + step / 2 + (y % 2 ? step / 2 : 0);
        const cy = y * step * 0.86 + step / 2;
        items.push({ cx, cy, r: step * 0.3 });
      }
    }
  } else {
    // arcs
    for (let i = 1; i <= density; i++) {
      const r = (i / density) * 60;
      items.push({ d: `M${50 - r},50 A${r},${r} 0 0 1 ${50 + r},50` });
    }
  }

  return items;
}

/**
 * Patrón abstracto generado del término de la carta. Determinista (mismo término, mismo
 * arte), decorativo puro: no comunica el significado.
 */
export function CardArt({ term, className }: { term: string; className?: string }) {
  const spec = cardArt(term);
  const items = shapes(spec.pattern, spec.density);
  const base = `hsl(${spec.hue} 65% 55%)`;
  const accent = `hsl(${spec.hue2} 70% 62%)`;
  const bg = `hsl(${spec.hue} 40% 22%)`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`bg-${spec.hue}-${spec.hue2}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor={`hsl(${spec.hue2} 45% 16%)`} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#bg-${spec.hue}-${spec.hue2})`} />
      <g transform={`rotate(${spec.rotation} 50 50)`} opacity="0.9">
        {items.map((it, i) =>
          it.d ? (
            <path
              key={i}
              d={it.d}
              fill={i % 3 === 0 ? accent : "none"}
              stroke={i % 3 === 0 ? "none" : base}
              strokeWidth="1.4"
              strokeLinecap="round"
              fillOpacity={0.85}
              strokeOpacity={0.75}
            />
          ) : (
            <circle key={i} cx={it.cx} cy={it.cy} r={it.r} fill={i % 2 === 0 ? base : accent} fillOpacity="0.8" />
          ),
        )}
      </g>
    </svg>
  );
}
