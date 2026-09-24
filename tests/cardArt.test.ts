import { describe, expect, it } from "vitest";
import { cardArt } from "@/lib/cardArt";

describe("cardArt", () => {
  it("es determinista para el mismo término", () => {
    expect(cardArt("give up")).toEqual(cardArt("give up"));
  });

  it("no depende de mayúsculas ni espacios extra", () => {
    expect(cardArt("Give Up")).toEqual(cardArt("  give up  "));
  });

  it("produce artes distintos para términos distintos, en la práctica", () => {
    const terms = ["give up", "look after", "run out of", "turn down", "find out", "piece of cake", "thorough"];
    const specs = terms.map((t) => JSON.stringify(cardArt(t)));
    expect(new Set(specs).size).toBe(terms.length);
  });

  it("mantiene los valores dentro de rango", () => {
    const spec = cardArt("hit the books");
    expect(spec.hue).toBeGreaterThanOrEqual(0);
    expect(spec.hue).toBeLessThan(360);
    expect(spec.hue2).toBeGreaterThanOrEqual(0);
    expect(spec.hue2).toBeLessThan(360);
    expect(spec.density).toBeGreaterThanOrEqual(4);
    expect(spec.density).toBeLessThanOrEqual(8);
    expect(["diamonds", "waves", "rays", "cells", "arcs"]).toContain(spec.pattern);
  });
});
