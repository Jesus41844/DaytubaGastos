import { diffDaysISO, getPeriods, type PaydayInput } from "./periods";

/**
 * Motor de análisis de ahorro. Todo es función pura: recibe arrays, devuelve
 * objetos. Sin Prisma, sin React, sin `Date.now()`. Solo mira gastos personales
 * (`category === "personal" && type === "expense"`): la plata de GREB no es suya.
 */

export type InsightTransaction = {
  id: string;
  amountCents: number;
  concept: string;
  category: string;
  type: string;
  date: string;
};

/** Quincena cerrada: tiene fin conocido. La quincena en curso nunca entra. */
export type ClosedPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
};

export type InsightsConfig = {
  /** Con menos no hay mediana ni "mejor quincena" con significado. */
  minClosedPeriods: number;
  /** Ventana de análisis: hábitos viejos no son accionables hoy. */
  windowSize: number;
  /** Parte de Pareto que se considera "la cabeza" del gasto. */
  paretoHeadShare: number;
  /** Piso de ruido como fracción del presupuesto base. */
  noiseFloorBudgetShare: number;
  daysPerYear: number;
  periodsPerYearClamp: [number, number];
};

export const DEFAULT_INSIGHTS_CONFIG: InsightsConfig = {
  minClosedPeriods: 3,
  windowSize: 6,
  paretoHeadShare: 0.8,
  noiseFloorBudgetShare: 0.01,
  daysPerYear: 365.25,
  periodsPerYearClamp: [12, 52],
};

export const NO_CONCEPT_LABEL = "(sin concepto)";

// ---------- utilidades ----------

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/** Desviación absoluta mediana: banda muerta en sus propios datos. */
function mad(values: number[]): number {
  if (values.length === 0) return 0;
  const m = median(values);
  return median(values.map((v) => Math.abs(v - m)));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ---------- conceptos ----------

export function normalizeConcept(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clave canónica: normalizado + singularización simple, para que "Almuerzos" y
 * "Almuerzo" caigan juntos. Matching exacto sobre esta clave, nada de fuzzy: lo
 * que más importa es que él pueda predecir por qué se agrupó algo ("si lo
 * escribes igual, se agrupa"). Un fuzzy uniría "Super 99" con "Super El
 * Machetazo" sin que pueda anticiparlo. Como la singularización puede unir
 * palabras distintas que terminan igual, la UI muestra siempre las variantes.
 */
export function conceptKey(raw: string): string {
  const normalized = normalizeConcept(raw);
  if (normalized === "") return "";
  return normalized
    .split(" ")
    .map((token) => {
      if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
      if (token.length > 3 && /[aeiou]s$/.test(token)) return token.slice(0, -1);
      return token;
    })
    .join(" ");
}

export type ConceptGroup = {
  key: string;
  label: string;
  variants: string[];
  totalCents: number;
  count: number;
  medianAmountCents: number;
  maxAmountCents: number;
  firstDate: string;
  lastDate: string;
  periodsPresent: number;
  byPeriod: { periodId: string; totalCents: number; count: number }[];
  /** Divide entre TODAS las quincenas analizadas: si algo aparece en 2 de 6,
   *  el ahorro real por quincena es menor. Usar el divisor chico inflaría. */
  avgPerPeriodCents: number;
  avgPerActivePeriodCents: number;
  shareOfSpend: number;
};

export function selectClosedPeriods(
  paydays: PaydayInput[],
  config: InsightsConfig = DEFAULT_INSIGHTS_CONFIG
): { window: ClosedPeriod[]; totalClosed: number } {
  const closed = getPeriods(paydays)
    .filter((p) => !p.isOngoing && !p.isUnassigned && p.startDate && p.endDate)
    .map((p) => ({
      id: p.id,
      startDate: p.startDate as string,
      endDate: p.endDate as string,
      days: diffDaysISO(p.startDate as string, p.endDate as string) + 1,
    }));

  return { window: closed.slice(-config.windowSize), totalClosed: closed.length };
}

export function personalExpenses(transactions: InsightTransaction[]): InsightTransaction[] {
  return transactions.filter((t) => t.category === "personal" && t.type === "expense");
}

function inPeriod(date: string, period: ClosedPeriod): boolean {
  return date >= period.startDate && date <= period.endDate;
}

export function groupByConcept(
  transactions: InsightTransaction[],
  periods: ClosedPeriod[]
): ConceptGroup[] {
  const totalSpent = transactions.reduce((sum, t) => sum + t.amountCents, 0);
  const buckets = new Map<string, InsightTransaction[]>();

  for (const t of transactions) {
    const key = conceptKey(t.concept);
    const list = buckets.get(key);
    if (list) list.push(t);
    else buckets.set(key, [t]);
  }

  const groups: ConceptGroup[] = [];

  for (const [key, rows] of buckets) {
    // Nombre mostrado: la variante cruda más usada. Desempate determinista.
    const counts = new Map<string, number>();
    for (const r of rows) {
      const raw = r.concept.trim();
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
    const variants = [...counts.keys()].sort((a, b) => {
      const byCount = (counts.get(b) as number) - (counts.get(a) as number);
      if (byCount !== 0) return byCount;
      if (b.length !== a.length) return b.length - a.length;
      return a.localeCompare(b);
    });

    const byPeriod = periods
      .map((p) => {
        const rowsIn = rows.filter((r) => inPeriod(r.date, p));
        return {
          periodId: p.id,
          totalCents: rowsIn.reduce((sum, r) => sum + r.amountCents, 0),
          count: rowsIn.length,
        };
      })
      .filter((entry) => entry.count > 0);

    const totalCents = rows.reduce((sum, r) => sum + r.amountCents, 0);
    const dates = rows.map((r) => r.date).sort();

    groups.push({
      key,
      label: key === "" ? NO_CONCEPT_LABEL : variants[0],
      variants,
      totalCents,
      count: rows.length,
      medianAmountCents: median(rows.map((r) => r.amountCents)),
      maxAmountCents: Math.max(...rows.map((r) => r.amountCents)),
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      periodsPresent: byPeriod.length,
      byPeriod,
      avgPerPeriodCents: periods.length > 0 ? Math.round(totalCents / periods.length) : 0,
      avgPerActivePeriodCents:
        byPeriod.length > 0 ? Math.round(totalCents / byPeriod.length) : totalCents,
      shareOfSpend: totalSpent > 0 ? totalCents / totalSpent : 0,
    });
  }

  return groups.sort((a, b) => b.totalCents - a.totalCents || a.key.localeCompare(b.key));
}

// ---------- contexto y umbrales ----------

export type AnalysisContext = {
  periodsAnalyzed: number;
  totalSpentCents: number;
  avgSpentPerPeriodCents: number;
  medianSpentPerPeriodCents: number;
  limitCents: number;
  /** Si no puso límite, se cae al promedio gastado: no se inventa un número. */
  budgetBaseCents: number;
  medianTicketCents: number;
  noiseFloorPerPeriodCents: number;
  tailKeys: string[];
  recurrenceThreshold: number;
};

export function buildContext(
  groups: ConceptGroup[],
  periods: ClosedPeriod[],
  transactions: InsightTransaction[],
  limitCents: number,
  config: InsightsConfig = DEFAULT_INSIGHTS_CONFIG
): AnalysisContext {
  const totalSpentCents = transactions.reduce((sum, t) => sum + t.amountCents, 0);
  const perPeriodTotals = periods.map((p) =>
    transactions.filter((t) => inPeriod(t.date, p)).reduce((sum, t) => sum + t.amountCents, 0)
  );
  const avgSpentPerPeriodCents = Math.round(mean(perPeriodTotals));
  const budgetBaseCents = limitCents > 0 ? limitCents : avgSpentPerPeriodCents;
  const medianTicketCents = median(transactions.map((t) => t.amountCents));

  // Dos anclas suyas: el 1% de su quincena (por debajo no hay decisión que se
  // note) y su ticket mediano (un concepto que cuesta menos por quincena que
  // UNA compra típica suya es marginal por construcción).
  const noiseFloorPerPeriodCents = Math.max(
    Math.round(config.noiseFloorBudgetShare * budgetBaseCents),
    medianTicketCents
  );

  // Cola de Pareto: lo que queda después de cubrir el 80% del gasto.
  const tailKeys: string[] = [];
  let cumulative = 0;
  for (const g of groups) {
    if (cumulative >= config.paretoHeadShare * totalSpentCents && totalSpentCents > 0) {
      tailKeys.push(g.key);
    }
    cumulative += g.totalCents;
  }

  return {
    periodsAnalyzed: periods.length,
    totalSpentCents,
    avgSpentPerPeriodCents,
    medianSpentPerPeriodCents: median(perPeriodTotals),
    limitCents,
    budgetBaseCents,
    medianTicketCents,
    noiseFloorPerPeriodCents,
    tailKeys,
    recurrenceThreshold: Math.ceil((2 / 3) * periods.length),
  };
}

// ---------- gastos poco relevantes ----------

export type LowValueReason =
  | "pareto_tail"
  | "below_noise_floor"
  | "sporadic"
  | "single_occurrence";

export type LowValueConcept = {
  group: ConceptGroup;
  reasons: LowValueReason[];
  perPeriodCents: number;
  annualCents: number;
  /** Eliminarlo todo el año no libera ni una quincena: la UI debe decirlo. */
  impactIsMarginal: boolean;
};

export function findLowValueConcepts(
  groups: ConceptGroup[],
  ctx: AnalysisContext,
  basis: YearBasis
): LowValueConcept[] {
  const tail = new Set(ctx.tailKeys);

  return groups
    .filter(
      (g) =>
        tail.has(g.key) &&
        g.avgPerPeriodCents < ctx.noiseFloorPerPeriodCents &&
        // Si aparece casi todas las quincenas es un gasto estructural (barato,
        // pero parte de su vida): decirle que lo suelte sería mal consejo.
        g.periodsPresent < ctx.recurrenceThreshold
    )
    .map((g) => {
      const reasons: LowValueReason[] = ["pareto_tail", "below_noise_floor"];
      // Ser esporádico nunca alcanza por sí solo: un gasto único de $300 es
      // esporádico y no es irrelevante.
      if (g.periodsPresent === 1 && ctx.periodsAnalyzed >= 3) reasons.push("sporadic");
      if (g.count === 1) reasons.push("single_occurrence");

      const annualCents = annualize(g.avgPerPeriodCents, basis);
      return {
        group: g,
        reasons,
        perPeriodCents: g.avgPerPeriodCents,
        annualCents,
        impactIsMarginal: annualCents < ctx.budgetBaseCents,
      };
    })
    .sort((a, b) => b.perPeriodCents - a.perPeriodCents || a.group.key.localeCompare(b.group.key));
}

// ---------- comparación entre quincenas ----------

export type PeriodStats = {
  periodId: string;
  startDate: string;
  endDate: string;
  days: number;
  spentCents: number;
  txCount: number;
  hasData: boolean;
  overLimitCents: number | null;
};

export type Trend = "improving" | "worsening" | "stable" | "unknown";

export type PeriodComparison = {
  periods: PeriodStats[];
  avgSpentCents: number;
  medianSpentCents: number;
  best: PeriodStats | null;
  worst: PeriodStats | null;
  trend: Trend;
  trendDeltaCents: number;
  savingsIfBestPerPeriodCents: number;
};

export function comparePeriods(
  periods: ClosedPeriod[],
  transactions: InsightTransaction[],
  limitCents: number
): PeriodComparison {
  const stats: PeriodStats[] = periods.map((p) => {
    const rows = transactions.filter((t) => inPeriod(t.date, p));
    const spentCents = rows.reduce((sum, t) => sum + t.amountCents, 0);
    return {
      periodId: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      days: p.days,
      spentCents,
      txCount: rows.length,
      hasData: rows.length > 0,
      overLimitCents: limitCents > 0 ? spentCents - limitCents : null,
    };
  });

  const totals = stats.map((s) => s.spentCents);
  const avgSpentCents = Math.round(mean(totals));

  // Una quincena sin registros es falta de datos, no récord de ahorro.
  const withData = stats.filter((s) => s.hasData);
  const best =
    withData.length > 0
      ? withData.reduce((a, b) => (b.spentCents < a.spentCents ? b : a))
      : null;
  const worst =
    withData.length > 0
      ? withData.reduce((a, b) => (b.spentCents > a.spentCents ? b : a))
      : null;

  let trend: Trend = "unknown";
  let trendDeltaCents = 0;
  if (stats.length >= 3) {
    const previous = totals.slice(0, -1);
    const last = totals[totals.length - 1];
    trendDeltaCents = last - median(previous);
    const band = mad(totals);
    if (band === 0) trend = "unknown";
    else if (Math.abs(trendDeltaCents) <= band) trend = "stable";
    else trend = trendDeltaCents < 0 ? "improving" : "worsening";
  }

  return {
    periods: stats,
    avgSpentCents,
    medianSpentCents: median(totals),
    best,
    worst,
    trend,
    trendDeltaCents,
    savingsIfBestPerPeriodCents: best ? Math.max(avgSpentCents - best.spentCents, 0) : 0,
  };
}

// ---------- proyección anual ----------

export type YearBasis = {
  avgPeriodDays: number;
  periodsPerYear: number;
  clamped: boolean;
};

/** Sus quincenas son irregulares: NO asumir 24 periodos al año. */
export function estimateYearBasis(
  periods: ClosedPeriod[],
  config: InsightsConfig = DEFAULT_INSIGHTS_CONFIG
): YearBasis {
  const avgPeriodDays = mean(periods.map((p) => p.days));
  if (avgPeriodDays <= 0) {
    return { avgPeriodDays: 0, periodsPerYear: 0, clamped: false };
  }
  const raw = config.daysPerYear / avgPeriodDays;
  const [min, max] = config.periodsPerYearClamp;
  const periodsPerYear = Math.min(Math.max(raw, min), max);
  return { avgPeriodDays, periodsPerYear, clamped: periodsPerYear !== raw };
}

export function annualize(perPeriodCents: number, basis: YearBasis): number {
  return Math.round(perPeriodCents * basis.periodsPerYear);
}

// ---------- acciones ----------

export type SavingActionKind = "reduce_to_best" | "return_to_best_period";

export type SavingAction = {
  id: string;
  kind: SavingActionKind;
  conceptKey: string | null;
  label: string;
  savingsPerPeriodCents: number;
  savingsAnnualCents: number;
  confidence: number;
  score: number;
  evidence: {
    occurrences: number;
    periodsPresent: number;
    periodsAnalyzed: number;
    totalCents: number;
    avgPerPeriodCents: number;
    bestPeriodCents?: number;
  };
};

export function buildSavingActions(
  groups: ConceptGroup[],
  lowValue: LowValueConcept[],
  comparison: PeriodComparison,
  ctx: AnalysisContext,
  basis: YearBasis,
  config: InsightsConfig = DEFAULT_INSIGHTS_CONFIG
): SavingAction[] {
  const actions: SavingAction[] = [];
  const lowValueKeys = new Set(lowValue.map((l) => l.group.key));
  // Un ahorro por debajo del 1% de su quincena no es una acción, es ruido:
  // pedirle que persiga 75 centavos le hace ignorar la lista entera.
  const minSavings = Math.round(config.noiseFloorBudgetShare * ctx.budgetBaseCents);

  for (const g of groups) {
    // Un concepto genera como máximo una acción, así los montos son disjuntos
    // y se pueden sumar sin doble conteo.
    if (lowValueKeys.has(g.key)) continue;
    if (g.periodsPresent < ctx.recurrenceThreshold || g.count < 3) continue;

    // La meta no es un "-30%" inventado: es lo que él YA gastó en ese concepto
    // en su quincena más barata. No se puede discutir, ya la cumplió.
    const bestPeriodCents = Math.min(...g.byPeriod.map((b) => b.totalCents));
    const savings = g.avgPerActivePeriodCents - bestPeriodCents;
    // Gasto perfectamente constante = costo fijo. No se emite acción.
    if (savings <= 0 || savings < minSavings) continue;

    const confidence = ctx.periodsAnalyzed > 0 ? g.periodsPresent / ctx.periodsAnalyzed : 0;
    actions.push({
      id: `reduce_to_best:${g.key}`,
      kind: "reduce_to_best",
      conceptKey: g.key,
      label: g.label,
      savingsPerPeriodCents: savings,
      savingsAnnualCents: annualize(savings, basis),
      confidence,
      score: savings * confidence,
      evidence: {
        occurrences: g.count,
        periodsPresent: g.periodsPresent,
        periodsAnalyzed: ctx.periodsAnalyzed,
        totalCents: g.totalCents,
        avgPerPeriodCents: g.avgPerActivePeriodCents,
        bestPeriodCents,
      },
    });
  }

  if (comparison.best && comparison.savingsIfBestPerPeriodCents > 0) {
    actions.push({
      id: "return_to_best_period:global",
      kind: "return_to_best_period",
      conceptKey: null,
      label: "Volver a tu mejor quincena",
      savingsPerPeriodCents: comparison.savingsIfBestPerPeriodCents,
      savingsAnnualCents: annualize(comparison.savingsIfBestPerPeriodCents, basis),
      confidence: 1,
      score: comparison.savingsIfBestPerPeriodCents,
      evidence: {
        occurrences: 0,
        periodsPresent: ctx.periodsAnalyzed,
        periodsAnalyzed: ctx.periodsAnalyzed,
        totalCents: ctx.totalSpentCents,
        avgPerPeriodCents: ctx.avgSpentPerPeriodCents,
        bestPeriodCents: comparison.best.spentCents,
      },
    });
  }

  return actions.sort(
    (a, b) => b.score - a.score || b.evidence.totalCents - a.evidence.totalCents || a.id.localeCompare(b.id)
  );
}

// ---------- orquestador ----------

export type CurrentPeriodSummary = {
  spentCents: number;
  txCount: number;
};

export type SavingsInsights =
  | {
      status: "insufficient_data";
      periodsClosed: number;
      periodsNeeded: number;
      preview: ConceptGroup[];
    }
  | {
      status: "ready";
      context: AnalysisContext;
      yearBasis: YearBasis;
      groups: ConceptGroup[];
      lowValue: LowValueConcept[];
      actions: SavingAction[];
      comparison: PeriodComparison;
      totals: {
        potentialSavingsPerPeriodCents: number;
        potentialSavingsAnnualCents: number;
      };
    };

export function computeSavingsInsights(input: {
  transactions: InsightTransaction[];
  paydays: PaydayInput[];
  limitCents: number;
  config?: Partial<InsightsConfig>;
}): SavingsInsights {
  const config = { ...DEFAULT_INSIGHTS_CONFIG, ...input.config };
  const { window, totalClosed } = selectClosedPeriods(input.paydays, config);
  const expenses = personalExpenses(input.transactions);

  if (totalClosed < config.minClosedPeriods) {
    const preview = groupByConcept(expenses, window);
    return {
      status: "insufficient_data",
      periodsClosed: totalClosed,
      periodsNeeded: config.minClosedPeriods,
      preview,
    };
  }

  const inWindow = expenses.filter((t) => window.some((p) => inPeriod(t.date, p)));
  const groups = groupByConcept(inWindow, window);
  const ctx = buildContext(groups, window, inWindow, input.limitCents, config);
  const basis = estimateYearBasis(window, config);
  const lowValue = findLowValueConcepts(groups, ctx, basis);
  const comparison = comparePeriods(window, inWindow, input.limitCents);
  const actions = buildSavingActions(groups, lowValue, comparison, ctx, basis, config);

  // `return_to_best_period` solapa con las acciones por concepto: sumarlo sería
  // doble conteo, así que se muestra pero no entra al total.
  const potentialSavingsPerPeriodCents = actions
    .filter((a) => a.kind !== "return_to_best_period")
    .reduce((sum, a) => sum + a.savingsPerPeriodCents, 0);

  return {
    status: "ready",
    context: ctx,
    yearBasis: basis,
    groups,
    lowValue,
    actions,
    comparison,
    totals: {
      potentialSavingsPerPeriodCents,
      potentialSavingsAnnualCents: annualize(potentialSavingsPerPeriodCents, basis),
    },
  };
}
