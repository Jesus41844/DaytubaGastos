import { describe, expect, it } from "vitest";
import { diffDaysISO, getPeriodProgress, getPeriods } from "../lib/periods";

const paydays = [
  { id: "p1", date: "2026-09-01" },
  { id: "p2", date: "2026-09-16" },
];

const [closed, ongoing] = getPeriods(paydays);

describe("diffDaysISO", () => {
  it("cuenta días entre fechas cruzando meses", () => {
    expect(diffDaysISO("2026-09-01", "2026-09-15")).toBe(14);
    expect(diffDaysISO("2026-08-30", "2026-09-02")).toBe(3);
  });
});

describe("getPeriodProgress", () => {
  it("ubica el día dentro de una quincena cerrada", () => {
    expect(getPeriodProgress(closed, "2026-09-05")).toEqual({
      dayNumber: 5,
      totalDays: 15,
      daysLeft: 11,
    });
  });

  it("el primer día es 1 y el último iguala el total", () => {
    expect(getPeriodProgress(closed, "2026-09-01")?.dayNumber).toBe(1);
    expect(getPeriodProgress(closed, "2026-09-15")?.dayNumber).toBe(15);
  });

  it("acota fechas fuera del rango en vez de salirse del medidor", () => {
    expect(getPeriodProgress(closed, "2026-09-30")?.dayNumber).toBe(15);
    expect(getPeriodProgress(closed, "2026-08-20")?.dayNumber).toBe(1);
  });

  it("devuelve null si la quincena sigue abierta (no se sabe cuántos días dura)", () => {
    expect(getPeriodProgress(ongoing, "2026-09-20")).toBeNull();
  });
});

describe("todayInTimezone", () => {
  it("usa la fecha de Panamá, no la de UTC", async () => {
    const { todayInTimezone } = await import("../lib/dates");
    // 2026-09-21 00:30 UTC = 2026-09-20 19:30 en Panamá
    expect(todayInTimezone(new Date("2026-09-21T00:30:00Z"))).toBe("2026-09-20");
    expect(todayInTimezone(new Date("2026-09-20T18:00:00Z"))).toBe("2026-09-20");
  });
});
