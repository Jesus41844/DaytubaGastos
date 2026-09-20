import { prisma } from "@/lib/db";
import { getAllPeriods, isDateInPeriod } from "@/lib/periods";
import { PeriodCard } from "@/components/PeriodCard";

export default async function PeriodsPage() {
  const [paydays, transactions] = await Promise.all([
    prisma.payday.findMany(),
    prisma.transaction.findMany(),
  ]);

  const periods = getAllPeriods(paydays)
    .map((period) => ({
      period,
      totalCents: transactions
        .filter((t) => isDateInPeriod(t.date, period))
        .reduce((sum, t) => sum + t.amountCents, 0),
      count: transactions.filter((t) => isDateInPeriod(t.date, period)).length,
    }))
    .filter(({ period, count }) => !period.isUnassigned || count > 0)
    .reverse();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Historial de quincenas</h1>
      {periods.length === 0 ? (
        <p className="text-sm text-zinc-500">Todavía no hay quincenas ni movimientos.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map(({ period, totalCents }) => (
            <PeriodCard key={period.id} period={period} totalCents={totalCents} />
          ))}
        </div>
      )}
    </div>
  );
}
