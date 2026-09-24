/**
 * Arte de carta generado a partir del término: mismo término, siempre el mismo dibujo.
 * Es abstracto a propósito — no puede sugerir el significado, así que puede mostrarse
 * durante la pregunta sin arruinar el ejercicio.
 */

export type ArtPattern = "diamonds" | "waves" | "rays" | "cells" | "arcs";

export type CardArtSpec = {
  hue: number;
  hue2: number;
  pattern: ArtPattern;
  density: number;
  rotation: number;
};

const PATTERNS: ArtPattern[] = ["diamonds", "waves", "rays", "cells", "arcs"];

/** FNV-1a de 32 bits. Determinista, rápido, sin dependencias. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Generador pseudoaleatorio simple (mulberry32) sembrado por el hash del término. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deriva el arte de una carta a partir de su término normalizado. */
export function cardArt(term: string): CardArtSpec {
  const key = term.trim().toLowerCase();
  const seed = hash32(key);
  const rand = mulberry32(seed);

  const hue = Math.floor(rand() * 360);
  // Segundo matiz a distancia fija en la rueda de color, para que combinen sin quedar iguales.
  const hue2 = (hue + 40 + Math.floor(rand() * 80)) % 360;
  const pattern = PATTERNS[Math.floor(rand() * PATTERNS.length)];
  const density = 4 + Math.floor(rand() * 5); // 4..8
  const rotation = Math.floor(rand() * 360);

  return { hue, hue2, pattern, density, rotation };
}
