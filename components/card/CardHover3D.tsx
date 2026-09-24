import type { ReactNode } from "react";
import clsx from "clsx";

const zones = [0, 1, 2, 3, 4, 5, 6, 7];

/** DaisyUI aplica la rotación al primer hijo y usa ocho zonas para seguir el puntero. */
export function CardHover3D({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("hover-3d", className)}>
      <div className="relative w-full rounded-2xl">{children}</div>
      {zones.map((zone) => <div key={zone} aria-hidden="true" />)}
    </div>
  );
}
