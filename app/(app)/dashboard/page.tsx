import Link from "next/link";
import { prisma } from "@/lib/db";
import { findPeriodForDate, getPeriodProgress, isDateInPeriod, todayISO } from "@/lib/periods";
import { computeAgrupacionRecap, computePersonalRecap } from "@/lib/recap";
import { getPersonalBudgetCents } from "@/lib/settings";
import { formatAmount, formatCurrency } from "@/lib/money";
import { formatDayMonth } from "@/lib/dates";
import { Card, DeepCard } from "@/components/ui/Card";
import { QuincenaMeter } from "@/components/QuincenaMeter";
import { TransactionTable } from "@/components/TransactionTable";

export default async function DashboardPage() {
  const today = todayISO();
  const [paydays, transactions, limitCents] = await Promise.all([
    prisma.payday.findMany(),
    prisma.transaction.findMany({ orderBy: { date: "desc" } }),
    getPersonalBudgetCents(),
  ]);

  const period = findPeriodForDate(today, paydays);
  const periodTransactions = transactions.filter((t) => isDateInPeriod(t.date, period));
  const personal = computePersonalRecap(periodTransactions, limitCents);
  const grupo = computeAgrupacionRecap(periodTransactions);
  const progress = getPeriodProgress(period, today);

  const overspent = personal.remainingCents < 0;

  return (
    <div className="flex flex-col gap-6">
      <DeepCard>
        <p className="eyebrow !text-[color:var(--on-deep-soft)]">
          {period.isUnassigned
            ? "Sin quincena marcada"
            : `Quincena · ${formatDayMonth(period.startDate as string)} — ${
                period.endDate ? formatDayMonth(period.endDate) : "hoy"
              }`}
        </p>

        <p className="mt-6 text-sm text-[color:var(--on-deep-soft)]">{overspent ? "Te pasaste por" : "Te queda"}</p>
        <p className="font-[family-name:var(--font-display)] text-6xl leading-none font-extrabold tracking-tight sm:text-7xl">
          <span className="align-top text-3xl font-bold text-[color:var(--on-deep-soft)] sm:text-4xl">$</span>
          {formatAmount(Math.abs(personal.remainingCents))}
        </p>

        <div className="mt-8">
          <QuincenaMeter recap={personal} progress={progress} />
        </div>
      </DeepCard>

      <Link
        href="/expenses/new"
        className="flex items-center justify-center gap-2 rounded-xl bg-[color:var(--sea)] px-5 py-4 text-center font-medium text-[color:var(--surface)] transition-all hover:brightness-110"
      >
        <span aria-hidden className="text-lg leading-none">
          +
        </span>
        Anotar un gasto
      </Link>

      <Card>
        <h2 className="eyebrow">GREB</h2>
        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-[color:var(--text-soft)]">Entró</dt>
            <dd className="figure mt-1 text-[color:var(--sea)]">
              {formatCurrency(grupo.incomeCents)}
            </dd>
          </div>
          <div>
            <dt className="text-[color:var(--text-soft)]">Salió</dt>
            <dd className="figure mt-1">{formatCurrency(grupo.expensesCents)}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--text-soft)]">Balance</dt>
            <dd
              className={`figure mt-1 font-medium ${
                grupo.balanceCents < 0 ? "text-[color:var(--coral)]" : "text-[color:var(--text)]"
              }`}
            >
              {formatCurrency(grupo.balanceCents)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow">Esta quincena</h2>
          <Link
            href="/periods"
            className="text-xs text-[color:var(--text-soft)] underline underline-offset-4 hover:text-[color:var(--text)]"
          >
            Ver todas
          </Link>
        </div>
        <div className="mt-2">
          <TransactionTable
            transactions={periodTransactions}
            emptyMessage="Todavía no anotas nada esta quincena. Empieza por el primer gasto."
          />
        </div>
      </Card>
    </div>
  );
}
