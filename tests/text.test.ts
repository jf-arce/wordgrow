import { describe, expect, it } from "vitest";
import { checkTyped, maskTerm, normalize, shuffle } from "@/lib/text";

describe("normalize", () => {
  it("ignora mayúsculas, tildes, puntuación y espacios", () => {
    expect(normalize("  Café,  au-LAIT! ")).toBe("cafe au lait");
  });
});

describe("checkTyped", () => {
  it("acepta la respuesta exacta sin importar tildes o mayúsculas", () => {
    expect(checkTyped("Give UP", "give up")).toBe("exact");
    expect(checkTyped("cafe", "café")).toBe("exact");
  });
  it("tolera un error de tipeo", () => {
    expect(checkTyped("recieve", "receive")).toBe("close");
  });
  it("tolera dos errores en respuestas largas", () => {
    expect(checkTyped("procrastinaton", "procrastination")).toBe("close");
    expect(checkTyped("procrastinatin!", "procrastination")).toBe("close");
  });
  it("rechaza lo vacío o distinto", () => {
    expect(checkTyped("", "give up")).toBe("wrong");
    expect(checkTyped("give in", "give up")).toBe("wrong");
  });
  it("no acepta typos en palabras muy cortas", () => {
    expect(checkTyped("cat", "car")).toBe("wrong");
  });
});

describe("maskTerm", () => {
  it("tapa el término en el ejemplo", () => {
    expect(maskTerm("Don't give up now.", "give up")).toBe("Don't _____ now.");
    expect(maskTerm("Give up, then give up again.", "give up")).toBe("_____, then _____ again.");
    expect(maskTerm("The caterpillar saw a cat.", "cat")).toBe("The caterpillar saw a _____.");
  });
  it("devuelve null si el ejemplo no lo contiene o el término tiene regex", () => {
    expect(maskTerm("Hello there", "give up")).toBeNull();
    expect(maskTerm("It costs (a lot)", "(a lot)")).toBe("It costs _____");
  });
});

describe("shuffle", () => {
  it("conserva los elementos y no muta el original", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect([...out].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
});
