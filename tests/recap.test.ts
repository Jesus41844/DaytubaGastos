import { describe, expect, it } from "vitest";
import { computeAgrupacionRecap, computePersonalRecap } from "../lib/recap";

const transactions = [
  { amountCents: 5000, category: "personal", type: "expense" },
  { amountCents: 3000, category: "personal", type: "expense" },
  { amountCents: 20000, category: "agrupacion", type: "income" },
  { amountCents: 8000, category: "agrupacion", type: "expense" },
];

describe("computePersonalRecap", () => {
  it("suma solo los gastos personales y calcula el restante contra el límite", () => {
    const recap = computePersonalRecap(transactions, 10000);
    expect(recap).toEqual({ spentCents: 8000, limitCents: 10000, remainingCents: 2000 });
  });

  it("permite quedar en negativo cuando se excede el límite", () => {
    const recap = computePersonalRecap(transactions, 5000);
    expect(recap.remainingCents).toBe(-3000);
  });
});

describe("computeAgrupacionRecap", () => {
  it("calcula ingresos, gastos y balance solo de la categoría agrupación", () => {
    const recap = computeAgrupacionRecap(transactions);
    expect(recap).toEqual({ incomeCents: 20000, expensesCents: 8000, balanceCents: 12000 });
  });
});
