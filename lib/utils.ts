import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases condicionales y resuelve conflictos de Tailwind. Usado por los
 * componentes copiados de components/evilcharts/ (registry EvilCharts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
