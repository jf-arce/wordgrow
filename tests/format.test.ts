import { describe, expect, it } from "vitest";
import { formatDue } from "@/lib/format";

const now = 1_000_000_000_000;
const H = 3_600_000;

describe("formatDue", () => {
  it("cubre los rangos", () => {
    expect(formatDue(now, { now, reps: 0 })).toBe("Sin repasar todavía");
    expect(formatDue(now - 1, { now })).toBe("Toca repasar");
    expect(formatDue(now + 10 * 60_000, { now })).toBe("Vuelve en menos de una hora");
    expect(formatDue(now + 5 * H, { now })).toBe("Vuelve hoy");
    expect(formatDue(now + 30 * H, { now })).toBe("Vuelve mañana");
    expect(formatDue(now + 7 * 24 * H, { now })).toBe("Vuelve en 7 días");
    expect(formatDue(now + 90 * 24 * H, { now })).toBe("Vuelve en 3 meses");
  });
});
