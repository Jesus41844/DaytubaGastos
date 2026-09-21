import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { findPeriodById, isDateInPeriod, periodLabel } from "@/lib/periods";
import { computeAgrupacionRecap, computePersonalRecap } from "@/lib/recap";
import { getPersonalBudgetCents } from "@/lib/settings";
import { formatCurrency } from "@/lib/money";
import { formatDayMonth } from "@/lib/dates";
import { Card } from "@/components/ui/Card";
import { TransactionTable } from "@/components/TransactionTable";

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-[color:var(--text-soft)]">{label}</dt>
      <dd className={`figure text-sm ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ paydayId: string }>;
}) {
  const { paydayId } = await params;
  const [paydays, transactions, limitCents] = await Promise.all([
    prisma.payday.findMany(),
    prisma.transaction.findMany({ orderBy: { date: "desc" } }),
    getPersonalBudgetCents(),
  ]);

  const period = findPeriodById(paydayId, paydays);
  if (!period) notFound();

  const rows = transactions.filter((t) => isDateInPeriod(t.date, period));
  const personal = computePersonalRecap(rows, limitCents);
  const grupo = computeAgrupacionRecap(rows);

  const title = period.isUnassigned
    ? periodLabel(period)
    : `${formatDayMonth(period.startDate as string)} — ${
        period.endDate ? formatDayMonth(period.endDate) : "hoy"
      }`;

  const overspent = personal.remainingCents < 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
            {title}
          </h1>
          {period.isOngoing && (
            <p className="mt-1 text-sm text-[color:var(--sea)]">En curso</p>
          )}
        </div>
        <a
          href={`/periods/${paydayId}/pdf`}
          className="rounded-lg bg-[color:var(--deep)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[color:var(--deep-soft)]"
        >
          Bajar el PDF
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="eyebrow">Tuyo</h2>
          <dl className="mt-4 flex flex-col gap-2">
            <Row label="Límite" value={formatCurrency(personal.limitCents)} />
            <Row label="Gastado" value={formatCurrency(personal.spentCents)} />
            <Row
              label={overspent ? "Te pasaste por" : "Te quedó"}
              value={formatCurrency(Math.abs(personal.remainingCents))}
              tone={overspent ? "text-[color:var(--coral)]" : "text-[color:var(--sea)]"}
            />
          </dl>
        </Card>
        <Card>
          <h2 className="eyebrow">GREB</h2>
          <dl className="mt-4 flex flex-col gap-2">
            <Row label="Entró" value={formatCurrency(grupo.incomeCents)} />
            <Row label="Salió" value={formatCurrency(grupo.expensesCents)} />
            <Row
              label="Balance"
              value={formatCurrency(grupo.balanceCents)}
              tone={
                grupo.balanceCents < 0 ? "text-[color:var(--coral)]" : "text-[color:var(--sea)]"
              }
            />
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="eyebrow">Movimientos</h2>
        <div className="mt-2">
          <TransactionTable
            transactions={rows}
            emptyMessage="Esta quincena quedó sin movimientos."
          />
        </div>
      </Card>
    </div>
  );
}
