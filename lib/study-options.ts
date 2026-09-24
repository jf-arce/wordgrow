import type { StudyMode } from "./quiz";
import type { StudySource } from "./study";

export const MODES: { value: StudyMode; hint: string }[] = [
  { value: "mixed", hint: "Empieza fácil y sube la dificultad según cuánto sabés cada carta." },
  { value: "choice", hint: "Ves la palabra y elegís su significado entre 2 y 4 opciones." },
  { value: "reverse", hint: "Ves el significado y elegís la palabra entre 2 y 4 opciones." },
  { value: "typed", hint: "Ves el significado y escribís la palabra." },
  { value: "cloze", hint: "Completás la oración con la palabra que falta." },
  { value: "flashcard", hint: "Das vuelta la tarjeta y decís si la sabías." },
];

export const SOURCE_HINTS: Record<StudySource, string> = {
  due: "Las que ya toca repasar según tu progreso.",
  all: "Todas las del mazo, en orden aleatorio.",
  hard: "Las que fallaste o siguen en las primeras etapas.",
  new: "Las que nunca repasaste.",
};

export const LIMIT_OPTIONS = [10, 20, 30, 50];

