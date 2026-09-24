import type { ReactNode } from "react";
import clsx from "clsx";
import { MAX_STAGE } from "@/lib/srs";

const FRAME_CLASS = ["frame-matte", "frame-bronze", "frame-silver", "frame-gold", "frame-holo"] as const;

export function frameClass(stage: number): string {
  const s = Math.min(Math.max(Math.round(stage), 0), MAX_STAGE);
  return FRAME_CLASS[s];
}

/** Marco de carta según el rango: mate, bronce, plata, oro y holográfico en experto. */
export function CardFrame({
  stage,
  className,
  style,
  children,
}: {
  stage: number;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={clsx("card-frame", frameClass(stage), className)} style={style}>
      {children}
    </div>
  );
}
