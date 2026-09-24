import { describe, expect, it } from "vitest";
import { isDueNow, isScheduledDay, msUntilNext, nextOccurrence, type ReminderPrefs } from "@/lib/reminders";

const base: ReminderPrefs = { enabled: true, days: [1, 3, 5], time: "19:00" }; // lun, mié, vie

describe("isScheduledDay", () => {
  it("es true sólo en los días elegidos, y siempre false si está apagado", () => {
    const monday = new Date("2026-09-21T10:00:00"); // lunes
    const tuesday = new Date("2026-09-22T10:00:00"); // martes
    expect(isScheduledDay(base, monday)).toBe(true);
    expect(isScheduledDay(base, tuesday)).toBe(false);
    expect(isScheduledDay({ ...base, enabled: false }, monday)).toBe(false);
  });
});

describe("isDueNow", () => {
  it("es true recién después de la hora configurada, en un día que toca", () => {
    const before = new Date("2026-09-21T18:59:00"); // lunes, antes de las 19
    const after = new Date("2026-09-21T19:01:00"); // lunes, después de las 19
    expect(isDueNow(base, before)).toBe(false);
    expect(isDueNow(base, after)).toBe(true);
  });

  it("es false en un día que no toca, aunque ya sea tarde", () => {
    const tuesdayNight = new Date("2026-09-22T22:00:00");
    expect(isDueNow(base, tuesdayNight)).toBe(false);
  });
});

describe("nextOccurrence", () => {
  it("null si está apagado o sin días elegidos", () => {
    expect(nextOccurrence({ ...base, enabled: false }, new Date())).toBeNull();
    expect(nextOccurrence({ ...base, days: [] }, new Date())).toBeNull();
  });

  it("encuentra el próximo día programado, saltando al día siguiente si ya pasó la hora de hoy", () => {
    const mondayAfterHours = new Date("2026-09-21T20:00:00"); // lunes 20:00, ya pasó el de hoy
    const next = nextOccurrence(base, mondayAfterHours);
    expect(next?.getDay()).toBe(3); // miércoles
    expect(next?.getHours()).toBe(19);
  });

  it("si todavía no llegó la hora de hoy, hoy mismo es el próximo", () => {
    const mondayMorning = new Date("2026-09-21T08:00:00");
    const next = nextOccurrence(base, mondayMorning);
    expect(next?.getDay()).toBe(1);
    expect(next?.getDate()).toBe(mondayMorning.getDate());
  });
});

describe("msUntilNext", () => {
  it("es positivo cuando hay un próximo recordatorio", () => {
    const ms = msUntilNext(base, new Date("2026-09-21T08:00:00"));
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(0);
  });

  it("null cuando está apagado", () => {
    expect(msUntilNext({ ...base, enabled: false }, new Date())).toBeNull();
  });
});
