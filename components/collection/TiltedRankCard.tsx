"use client";

import { useRef, type ReactNode } from "react";
import { useCardTilt } from "@/components/card/useCardTilt";

/** Aplica la inclinación a la carta misma, sin alterar su tamaño en la grilla. */
export function TiltedRankCard({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useCardTilt(ref);

  return (
    <div
      ref={ref}
      className={`${className} ${tilt.className}`}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      {children}
    </div>
  );
}
