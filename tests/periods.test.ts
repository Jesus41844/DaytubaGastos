import { describe, expect, it } from "vitest";
import { addDaysISO, findPeriodForDate, getPeriods, isDateInPeriod } from "../lib/periods";

const paydays = [
  { id: "p1", date: "2026-09-05" },
  { id: "p2", date: "2026-09-20" },
];

describe("addDaysISO", () => {
  it("suma y resta días respetando cambios de mes", () => {
    expect(addDaysISO("2026-09-20", -1)).toBe("2026-09-19");
    expect(addDaysISO("2026-09-30", 1)).toBe("2026-10-01");
  });
});

describe("getPeriods", () => {
  it("ordena los paydays sin importar el orden de inserción", () => {
    const reversed = [paydays[1], paydays[0]];
    const periods = getPeriods(reversed);
    expect(periods.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("cierra cada periodo un día antes del siguiente payday", () => {
    const periods = getPeriods(paydays);
    expect(periods[0]).toMatchObject({
      id: "p1",
      startDate: "2026-09-05",
      endDate: "2026-09-19",
      isOngoing: false,
    });
  });

  it("deja el último periodo en curso (endDate null)", () => {
    const periods = getPeriods(paydays);
    expect(periods[1]).toMatchObject({
      id: "p2",
      startDate: "2026-09-20",
      endDate: null,
      isOngoing: true,
    });
  });
});

describe("findPeriodForDate", () => {
  it("un gasto el mismo día del payday pertenece al periodo que abre", () => {
    const period = findPeriodForDate("2026-09-05", paydays);
    expect(period.id).toBe("p1");
  });

  it("un gasto el día antes del siguiente payday pertenece al periodo que cierra", () => {
    const period = findPeriodForDate("2026-09-19", paydays);
    expect(period.id).toBe("p1");
  });

  it("un gasto posterior al último payday cae en el periodo en curso", () => {
    const period = findPeriodForDate("2026-09-25", paydays);
    expect(period.id).toBe("p2");
    expect(period.isOngoing).toBe(true);
  });

  it("un gasto anterior al primer payday cae en el bucket unassigned", () => {
    const period = findPeriodForDate("2026-09-01", paydays);
    expect(period.isUnassigned).toBe(true);
    expect(period.endDate).toBe("2026-09-04");
  });

  it("sin ningún payday registrado, todo cae en unassigned sin límites", () => {
    const period = findPeriodForDate("2026-01-01", []);
    expect(period.isUnassigned).toBe(true);
    expect(period.endDate).toBeNull();
  });
});

describe("isDateInPeriod", () => {
  it("coincide con findPeriodForDate para el bucket unassigned", () => {
    const period = findPeriodForDate("2026-09-01", paydays);
    expect(isDateInPeriod("2026-09-01", period)).toBe(true);
    expect(isDateInPeriod("2026-09-05", period)).toBe(false);
  });
});
