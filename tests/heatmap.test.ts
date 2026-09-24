import { describe, expect, it } from "vitest";
import { buildHeatGrid, level, weekdayIndex } from "@/lib/heatmap";

describe("heatmap", () => {
  it("usa lunes como primer día", () => {
    expect(weekdayIndex("2026-09-14")).toBe(0); // lunes
    expect(weekdayIndex("2026-09-20")).toBe(6); // domingo
  });

  it("asigna niveles proporcionales al máximo", () => {
    expect(level(0, 10)).toBe(0);
    expect(level(1, 10)).toBe(1);
    expect(level(5, 10)).toBe(2);
    expect(level(10, 10)).toBe(4);
    expect(level(3, 0)).toBe(0);
  });

  it("calcula el relleno y las semanas", () => {
    const days = Array.from({ length: 84 }, (_, i) => ({
      day: `2026-09-${String(i < 17 ? 14 + (i % 7) : 14).padStart(2, "0")}`,
      count: i,
    }));
    const grid = buildHeatGrid(days);
    expect(grid.pad).toBe(0);
    expect(grid.weeks).toBe(12);
    expect(grid.max).toBe(83);
    expect(grid.levels).toHaveLength(84);
    expect(buildHeatGrid([]).weeks).toBe(0);
  });
});
