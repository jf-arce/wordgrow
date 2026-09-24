"use client";

import type { RefObject } from "react";
import { useMotionValue, useSpring, useMotionValueEvent, useReducedMotion } from "motion/react";

const MAX_TILT = 10;

/**
 * Inclinación 3D + posición del brillo holográfico, siguiendo el puntero.
 * Sólo para cartas que se están "admirando" (álbum, resumen, ascenso de rango) —
 * nunca mientras se responde una pregunta, para no meter ruido en la lectura.
 *
 * Usa useMotionValue/useSpring de `motion` (ya instalado) en vez de una librería de
 * tilt aparte: así no hay dos sistemas escribiendo `transform` sobre el mismo nodo que
 * ya anima flips y entradas con motion.
 *
 * Recibe el ref del elemento (creado con `useRef` en el componente) en vez de devolverlo,
 * para que la asignación `ref={...}` en el JSX sea siempre un `useRef` directo.
 */
export function useCardTilt(ref: RefObject<HTMLDivElement | null>) {
  const reduceMotion = useReducedMotion();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 24 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 24 });

  // Las motion values escriben directo en el nodo vía CSS custom properties, para no
  // re-renderizar React en cada mousemove.
  useMotionValueEvent(springX, "change", (v) => ref.current?.style.setProperty("--tilt-x", `${v}deg`));
  useMotionValueEvent(springY, "change", (v) => ref.current?.style.setProperty("--tilt-y", `${v}deg`));

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    rotateY.set((px - 0.5) * MAX_TILT * 2);
    rotateX.set(-(py - 0.5) * MAX_TILT * 2);
    el.style.setProperty("--holo-x", `${px * 100}%`);
    el.style.setProperty("--holo-y", `${py * 100}%`);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return { onPointerMove, onPointerLeave, className: reduceMotion ? "" : "card-tilt" };
}
