import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { findPeriodById, isDateInPeriod, periodLabel } from "@/lib/periods";
import { computeAgrupacionRecap, computePersonalRecap } from "@/lib/recap";
import { getPersonalBudgetCents } from "@/lib/settings";
import { formatCurrency } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { TransactionTable } from "@/components/TransactionTable";

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={emphasis ?? "font-medium"}>{value}</dd>
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

  const periodTransactions = transactions.filter((t) => isDateInPeriod(t.date, period));
  const personalRecap = computePersonalRecap(periodTransactions, limitCents);
  const agrupacionRecap = computeAgrupacionRecap(periodTransactions);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{periodLabel(period)}</h1>
          {period.isOngoing && <p className="text-sm text-emerald-600">En curso</p>}
        </div>
        <a
          href={`/periods/${paydayId}/pdf`}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Generar PDF
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Personal</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Límite quincenal" value={formatCurrency(personalRecap.limitCents)} />
            <Row label="Gastado" value={formatCurrency(personalRecap.spentCents)} />
            <Row
              label={personalRecap.remainingCents < 0 ? "Excedido" : "Restante"}
              value={formatCurrency(Math.abs(personalRecap.remainingCents))}
              emphasis={personalRecap.remainingCents < 0 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}
            />
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Agrupación</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Ingresos" value={formatCurrency(agrupacionRecap.incomeCents)} />
            <Row label="Gastos" value={formatCurrency(agrupacionRecap.expensesCents)} />
            <Row
              label="Balance"
              value={formatCurrency(agrupacionRecap.balanceCents)}
              emphasis={agrupacionRecap.balanceCents < 0 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}
            />
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Movimientos</h2>
        <TransactionTable transactions={periodTransactions} />
      </Card>
    </div>
  );
}
