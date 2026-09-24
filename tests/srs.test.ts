import { describe, expect, it } from "vitest";
import { isDue, nextProgress, RETRY_DELAY_MS, stageInfo } from "@/lib/srs";

const DAY = 86_400_000;
const now = 1_000_000_000_000;
const fresh = { stage: 0, reps: 0, lapses: 0 };

describe("nextProgress", () => {
  it("sube una etapa al acertar y agenda según la etapa nueva", () => {
    const r = nextProgress(fresh, "correct", now);
    expect(r.stage).toBe(1);
    expect(r.dueAt).toBe(now + DAY);
    const r2 = nextProgress({ ...fresh, stage: 2 }, "correct", now);
    expect(r2.stage).toBe(3);
    expect(r2.dueAt).toBe(now + 7 * DAY);
  });

  it("no pasa de la etapa 4", () => {
    const r = nextProgress({ stage: 4, reps: 9, lapses: 0 }, "correct", now);
    expect(r.stage).toBe(4);
    expect(r.dueAt).toBe(now + 14 * DAY);
  });

  it("baja dos etapas (mínimo 1, sin subir) al fallar, suma lapse y vuelve en 10 min", () => {
    const r = nextProgress({ stage: 3, reps: 5, lapses: 1 }, "wrong", now);
    expect(r.stage).toBe(1);
    expect(r.lapses).toBe(2);
    expect(r.dueAt).toBe(now + RETRY_DELAY_MS);
    expect(nextProgress({ ...fresh, stage: 1 }, "wrong", now).stage).toBe(1);
    // Fallar nunca hace crecer: un novato sigue siendo novato.
    expect(nextProgress(fresh, "wrong", now).stage).toBe(0);
    // Desde el rango máximo también baja dos: Experto -> Hábil.
    expect(nextProgress({ ...fresh, stage: 4 }, "wrong", now).stage).toBe(2);
  });

  it("se queda en la etapa cuando dudás", () => {
    const r = nextProgress({ stage: 3, reps: 2, lapses: 0 }, "unsure", now);
    expect(r.stage).toBe(3);
    expect(r.dueAt).toBe(now + 3.5 * DAY);
    expect(nextProgress(fresh, "unsure", now).dueAt).toBe(now + RETRY_DELAY_MS);
  });

  it("cuenta cada repaso", () => {
    expect(nextProgress({ stage: 1, reps: 4, lapses: 0 }, "correct", now).reps).toBe(5);
  });
});

describe("stageInfo / isDue", () => {
  it("acota la etapa al rango válido", () => {
    expect(stageInfo(-3).name).toBe("Novato");
    expect(stageInfo(99).name).toBe("Experto");
  });
  it("está pendiente cuando venció", () => {
    expect(isDue(now, now)).toBe(true);
    expect(isDue(now + 1, now)).toBe(false);
  });
});

describe("stageCount", () => {
  it("usa singular y plural correctos", async () => {
    const { stageCount } = await import("@/lib/srs");
    expect(stageCount(0, 1)).toBe("1 novato");
    expect(stageCount(2, 3)).toBe("3 hábiles");
    expect(stageCount(4, 0)).toBe("0 expertos");
  });
});
