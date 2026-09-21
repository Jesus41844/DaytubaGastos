import { describe, expect, it } from "vitest";
import {
  DEFAULT_INSIGHTS_CONFIG,
  computeSavingsInsights,
  conceptKey,
  estimateYearBasis,
  groupByConcept,
  normalizeConcept,
  selectClosedPeriods,
  type InsightTransaction,
} from "../lib/insights";

// 4 cobros -> 3 quincenas cerradas + 1 en curso.
const paydays = [
  { id: "p1", date: "2026-06-01" },
  { id: "p2", date: "2026-06-16" },
  { id: "p3", date: "2026-07-01" },
  { id: "p4", date: "2026-07-16" },
];

let seq = 0;
function tx(
  date: string,
  concept: string,
  amount: number,
  over: Partial<InsightTransaction> = {}
): InsightTransaction {
  return {
    id: `t${seq++}`,
    date,
    concept,
    amountCents: amount,
    category: "personal",
    type: "expense",
    ...over,
  };
}

const base: InsightTransaction[] = [
  // Almuerzos: recurrente en las 3 quincenas, con una barata (la 3ra).
  tx("2026-06-03", "Almuerzos", 6000),
  tx("2026-06-10", "almuerzo", 4000),
  tx("2026-06-20", "Almuerzos", 9000),
  tx("2026-07-02", "Almuerzos", 3000),
  // Super: recurrente y constante.
  tx("2026-06-05", "Super", 5000),
  tx("2026-06-18", "Super", 5000),
  tx("2026-07-05", "Super", 5000),
  // Cosas chicas de la cola.
  tx("2026-06-07", "Chicle", 50),
  tx("2026-07-08", "Stickers", 80),
];

describe("normalizeConcept / conceptKey", () => {
  it("agrupa variantes de mayúsculas, acentos y espacios", () => {
    expect(normalizeConcept("  Almuerzo ")).toBe("almuerzo");
    expect(normalizeConcept("Café")).toBe("cafe");
    expect(conceptKey("Almuerzos")).toBe(conceptKey(" almuerzo "));
  });

  it("no le quita la s a palabras cortas", () => {
    expect(conceptKey("Gas")).toBe("gas");
    expect(conceptKey("Mes")).toBe("mes");
  });

  it("un concepto solo con puntuación da clave vacía sin reventar", () => {
    expect(conceptKey("!!!")).toBe("");
  });
});

describe("selectClosedPeriods", () => {
  it("excluye la quincena en curso", () => {
    const { window, totalClosed } = selectClosedPeriods(paydays);
    expect(totalClosed).toBe(3);
    expect(window.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("sin paydays no hay quincenas cerradas", () => {
    expect(selectClosedPeriods([]).totalClosed).toBe(0);
  });

  it("analiza solo las últimas N quincenas, no todo el historial", () => {
    // 10 cobros mensuales -> 9 quincenas cerradas.
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`,
      date: `2026-${String(i + 1).padStart(2, "0")}-01`,
    }));
    const { window, totalClosed } = selectClosedPeriods(many);
    expect(totalClosed).toBe(9);
    expect(window).toHaveLength(DEFAULT_INSIGHTS_CONFIG.windowSize);
    // Se queda con las más recientes.
    expect(window[window.length - 1].id).toBe("q8");
  });
});

describe("groupByConcept", () => {
  const { window } = selectClosedPeriods(paydays);
  const groups = groupByConcept(base, window);

  it("junta las variantes en una sola fila", () => {
    const almuerzos = groups.find((g) => g.key === conceptKey("Almuerzos"));
    expect(almuerzos?.count).toBe(4);
    expect(almuerzos?.variants).toContain("Almuerzos");
    expect(almuerzos?.variants).toContain("almuerzo");
  });

  it("muestra como etiqueta la variante más usada, no la clave interna", () => {
    const almuerzos = groups.find((g) => g.key === conceptKey("Almuerzos"));
    expect(almuerzos?.label).toBe("Almuerzos");
  });

  it("promedia entre todas las quincenas, no solo donde aparece", () => {
    const stickers = groups.find((g) => g.label === "Stickers");
    // 80 en 1 de 3 quincenas -> ~27 por quincena, no 80.
    expect(stickers?.avgPerPeriodCents).toBe(27);
    expect(stickers?.avgPerActivePeriodCents).toBe(80);
  });
});

describe("estimateYearBasis", () => {
  it("deriva los periodos al año de la duración real, no asume 24", () => {
    const { window } = selectClosedPeriods(paydays);
    const basis = estimateYearBasis(window);
    expect(basis.avgPeriodDays).toBeGreaterThan(14);
    expect(basis.periodsPerYear).toBeGreaterThan(20);
    expect(basis.periodsPerYear).toBeLessThan(27);
  });

  it("acota periodos absurdamente cortos", () => {
    const basis = estimateYearBasis([
      { id: "a", startDate: "2026-01-01", endDate: "2026-01-01", days: 1 },
    ]);
    expect(basis.clamped).toBe(true);
    expect(basis.periodsPerYear).toBe(52);
  });
});

describe("computeSavingsInsights — activación", () => {
  it("con menos de 3 quincenas cerradas no promete ahorros", () => {
    const result = computeSavingsInsights({
      transactions: base,
      paydays: paydays.slice(0, 3), // 2 cerradas
      limitCents: 60000,
    });
    expect(result.status).toBe("insufficient_data");
    if (result.status === "insufficient_data") {
      expect(result.periodsClosed).toBe(2);
      expect(result.periodsNeeded).toBe(3);
      expect(result.preview.length).toBeGreaterThan(0);
    }
  });

  it("con exactamente 3 quincenas cerradas ya analiza", () => {
    const result = computeSavingsInsights({ transactions: base, paydays, limitCents: 60000 });
    expect(result.status).toBe("ready");
  });

  it("sin datos no revienta", () => {
    const result = computeSavingsInsights({ transactions: [], paydays: [], limitCents: 0 });
    expect(result.status).toBe("insufficient_data");
  });
});

describe("computeSavingsInsights — análisis", () => {
  const result = computeSavingsInsights({ transactions: base, paydays, limitCents: 60000 });
  if (result.status !== "ready") throw new Error("esperaba ready");

  it("la meta de recorte es su propia quincena más barata", () => {
    const action = result.actions.find((a) => a.id.startsWith("reduce_to_best:"));
    expect(action).toBeDefined();
    // Almuerzos: 10000 / 9000 / 3000 por quincena; promedio activo 7333, mejor 3000.
    expect(action?.evidence.bestPeriodCents).toBe(3000);
    expect(action?.savingsPerPeriodCents).toBe(4333);
  });

  it("un gasto perfectamente constante no genera acción (es costo fijo)", () => {
    const superAction = result.actions.find((a) => a.conceptKey === conceptKey("Super"));
    expect(superAction).toBeUndefined();
  });

  it("marca los gastos chicos de la cola como poco relevantes", () => {
    const labels = result.lowValue.map((l) => l.group.label);
    expect(labels).toContain("Chicle");
    expect(result.lowValue.every((l) => l.impactIsMarginal)).toBe(true);
  });

  it("un gasto barato pero recurrente no se marca como prescindible", () => {
    // Metro: poco dinero, pero aparece en TODAS las quincenas. Es estructural.
    const conMetro = [
      ...base,
      tx("2026-06-02", "Metro", 1200),
      tx("2026-06-17", "Metro", 1200),
      tx("2026-07-04", "Metro", 1200),
    ];
    const r = computeSavingsInsights({ transactions: conMetro, paydays, limitCents: 60000 });
    if (r.status !== "ready") throw new Error("esperaba ready");
    expect(r.lowValue.some((l) => l.group.label === "Metro")).toBe(false);
    // Los sueltos sí siguen apareciendo.
    expect(r.lowValue.some((l) => l.group.label === "Chicle")).toBe(true);
  });

  it("no propone perseguir centavos", () => {
    // Un concepto recurrente y casi constante: el recorte posible es trivial.
    const conTrivial = [
      ...base,
      tx("2026-06-02", "Bus", 1200),
      tx("2026-06-17", "Bus", 1205),
      tx("2026-07-04", "Bus", 1210),
    ];
    const r = computeSavingsInsights({ transactions: conTrivial, paydays, limitCents: 60000 });
    if (r.status !== "ready") throw new Error("esperaba ready");
    expect(r.actions.some((a) => a.label === "Bus")).toBe(false);
  });

  it("no cuenta dos veces: el total excluye volver-a-tu-mejor-quincena", () => {
    const sumOfAll = result.actions.reduce((s, a) => s + a.savingsPerPeriodCents, 0);
    expect(result.totals.potentialSavingsPerPeriodCents).toBeLessThan(sumOfAll);
  });

  it("un concepto genera como máximo una acción", () => {
    const keys = result.actions.filter((a) => a.conceptKey).map((a) => a.conceptKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("la quincena en curso no entra en el análisis", () => {
    expect(result.context.periodsAnalyzed).toBe(3);
    expect(result.comparison.periods.every((p) => p.endDate <= "2026-07-15")).toBe(true);
  });

  it("es idempotente", () => {
    const again = computeSavingsInsights({ transactions: base, paydays, limitCents: 60000 });
    expect(JSON.stringify(again)).toBe(JSON.stringify(result));
  });
});

describe("computeSavingsInsights — bordes", () => {
  it("con límite en 0 no divide por cero y cae al promedio gastado", () => {
    const result = computeSavingsInsights({ transactions: base, paydays, limitCents: 0 });
    if (result.status !== "ready") throw new Error("esperaba ready");
    expect(result.context.budgetBaseCents).toBe(result.context.avgSpentPerPeriodCents);
    expect(Number.isFinite(result.totals.potentialSavingsAnnualCents)).toBe(true);
  });

  it("ignora los gastos de GREB", () => {
    const withGreb = [
      ...base,
      tx("2026-06-04", "Impresiones GREB", 50000, { category: "agrupacion" }),
    ];
    const result = computeSavingsInsights({ transactions: withGreb, paydays, limitCents: 60000 });
    if (result.status !== "ready") throw new Error("esperaba ready");
    expect(result.groups.some((g) => g.label.includes("GREB"))).toBe(false);
  });

  it("un gasto único y enorme no se marca como poco relevante", () => {
    const withBig = [...base, tx("2026-07-03", "Laptop", 120000)];
    const result = computeSavingsInsights({ transactions: withBig, paydays, limitCents: 60000 });
    if (result.status !== "ready") throw new Error("esperaba ready");
    expect(result.lowValue.some((l) => l.group.label === "Laptop")).toBe(false);
  });

  it("una quincena cerrada sin gastos no es la mejor quincena", () => {
    const sparse = base.filter((t) => !t.date.startsWith("2026-07"));
    const result = computeSavingsInsights({ transactions: sparse, paydays, limitCents: 60000 });
    if (result.status !== "ready") throw new Error("esperaba ready");
    expect(result.comparison.best?.hasData).toBe(true);
  });
});
