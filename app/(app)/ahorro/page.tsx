import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeSavingsInsights, type SavingAction } from "@/lib/insights";
import { getPersonalBudgetCents } from "@/lib/settings";
import { formatAmount, formatCurrency } from "@/lib/money";
import { formatDayMonth } from "@/lib/dates";
import { Card, DeepCard } from "@/components/ui/Card";

function actionDetail(action: SavingAction): string {
  const e = action.evidence;
  switch (action.kind) {
    case "reduce_to_best":
      return `${e.occurrences} veces en ${e.periodsPresent} de ${e.periodsAnalyzed} quincenas. Promedias ${formatCurrency(
        e.avgPerPeriodCents
      )}, pero ya lo bajaste a ${formatCurrency(e.bestPeriodCents ?? 0)} una vez.`;
    case "return_to_best_period":
      return `Promedias ${formatCurrency(e.avgPerPeriodCents)} por quincena y tu mejor quincena fue de ${formatCurrency(
        e.bestPeriodCents ?? 0
      )}.`;
  }
}

function actionTitle(action: SavingAction): string {
  switch (action.kind) {
    case "reduce_to_best":
      return `Baja «${action.label}» a lo que ya gastaste`;
    case "return_to_best_period":
      return action.label;
  }
}

export default async function AhorroPage() {
  const [paydays, transactions, limitCents] = await Promise.all([
    prisma.payday.findMany(),
    prisma.transaction.findMany(),
    getPersonalBudgetCents(),
  ]);

  const insights = computeSavingsInsights({ transactions, paydays, limitCents });

  if (insights.status === "insufficient_data") {
    const faltan = insights.periodsNeeded - insights.periodsClosed;
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Ahorro
        </h1>
        <Card>
          <p className="text-sm">
            Para comparar hacen falta {insights.periodsNeeded} quincenas cerradas y llevas{" "}
            {insights.periodsClosed}. Te{faltan === 1 ? " falta " : "n faltan "}
            {faltan} {faltan === 1 ? "cobro" : "cobros"} más por marcar en{" "}
            <Link href="/calendar" className="text-[color:var(--sea)] underline underline-offset-4">
              Cobros
            </Link>
            .
          </p>
          <p className="mt-3 text-sm text-[color:var(--text-soft)]">
            Con menos quincenas cualquier diferencia es ruido, y prefiero no inventarte un
            ahorro que no se sostiene.
          </p>
        </Card>

        {insights.preview.length > 0 && (
          <Card>
            <h2 className="eyebrow">En lo que va</h2>
            <ul className="mt-3 divide-y divide-[color:var(--line)]">
              {insights.preview.slice(0, 8).map((g) => (
                <li key={g.key} className="flex items-baseline justify-between py-2.5 text-sm">
                  <span>{g.label}</span>
                  <span className="figure">{formatCurrency(g.totalCents)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  const { context, comparison, totals, actions, lowValue, yearBasis } = insights;
  const topActions = actions.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Ahorro
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-soft)]">
          Según tus últimas {context.periodsAnalyzed} quincenas cerradas.
        </p>
      </div>

      <DeepCard>
        <p className="eyebrow !text-[color:var(--on-deep-soft)]">Podrías ahorrar</p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-none font-extrabold tracking-tight sm:text-6xl">
          <span className="align-top text-2xl font-bold text-[color:var(--on-deep-soft)] sm:text-3xl">
            $
          </span>
          {formatAmount(totals.potentialSavingsPerPeriodCents)}
        </p>
        <p className="mt-2 text-sm text-[color:var(--on-deep-soft)]">
          por quincena — unos{" "}
          <span className="figure text-[color:var(--on-deep)]">
            {formatCurrency(totals.potentialSavingsAnnualCents)}
          </span>{" "}
          al año, a razón de {Math.round(yearBasis.periodsPerYear)} quincenas.
        </p>
      </DeepCard>

      <Card>
        <h2 className="eyebrow">Qué hacer</h2>
        {topActions.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--text-soft)]">
            No encuentro nada claro que recortar: tus gastos no se repiten lo suficiente como
            para sacar un patrón.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--line)]">
            {topActions.map((action) => (
              <li key={action.id} className="py-4 first:pt-1">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium">{actionTitle(action)}</p>
                  <span className="figure shrink-0 text-sm text-[color:var(--sea)]">
                    {formatCurrency(action.savingsPerPeriodCents)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                  {actionDetail(action)}
                </p>
                {action.kind === "return_to_best_period" && (
                  <p className="mt-1 text-xs text-[color:var(--text-soft)]">
                    No suma al total: se solapa con lo de arriba.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="eyebrow">Gastos poco relevantes</h2>
        {lowValue.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--text-soft)]">
            Nada suelto: lo que anotas o pesa en la quincena o se repite todos los periodos.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-[color:var(--text-soft)]">
              Chicos, sueltos y sin repetirse. Sirven para ordenar la cabeza, no para ahorrar
              de verdad.
            </p>
            <ul className="mt-2 divide-y divide-[color:var(--line)]">
              {lowValue.slice(0, 8).map((l) => (
                <li key={l.group.key} className="flex items-baseline justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{l.group.label}</p>
                    <p className="text-xs text-[color:var(--text-soft)]">
                      {l.group.count} {l.group.count === 1 ? "vez" : "veces"} ·{" "}
                      {formatCurrency(l.perPeriodCents)} por quincena
                      {l.group.variants.length > 1 && ` · incluye ${l.group.variants.join(", ")}`}
                    </p>
                  </div>
                  <span className="figure shrink-0 text-sm text-[color:var(--text-soft)]">
                    {formatCurrency(l.group.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <h2 className="eyebrow">Tus quincenas</h2>
        <ul className="mt-3 divide-y divide-[color:var(--line)]">
          {comparison.periods.map((p) => {
            const isBest = comparison.best?.periodId === p.periodId;
            const pct =
              context.budgetBaseCents > 0
                ? Math.min((p.spentCents / context.budgetBaseCents) * 100, 100)
                : 0;
            return (
              <li key={p.periodId} className="py-3">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span>
                    {formatDayMonth(p.startDate)} — {formatDayMonth(p.endDate)}
                    {isBest && (
                      <span className="eyebrow ml-2 !text-[color:var(--sea)]">tu mejor</span>
                    )}
                  </span>
                  <span className="figure">{formatCurrency(p.spentCents)}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[color:var(--surface)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: isBest ? "var(--sea)" : "var(--text-soft)",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 border-t border-[color:var(--line)] pt-4 text-sm text-[color:var(--text-soft)]">
          Promedias <span className="figure">{formatCurrency(comparison.avgSpentCents)}</span> por
          quincena.
        </p>
      </Card>
    </div>
  );
}
