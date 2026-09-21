import { prisma } from "@/lib/db";
import { getAllPeriods, isDateInPeriod } from "@/lib/periods";
import { PeriodCard } from "@/components/PeriodCard";

export default async function PeriodsPage() {
  const [paydays, transactions] = await Promise.all([
    prisma.payday.findMany(),
    prisma.transaction.findMany(),
  ]);

  const periods = getAllPeriods(paydays)
    .map((period) => {
      const rows = transactions.filter((t) => isDateInPeriod(t.date, period));
      return {
        period,
        count: rows.length,
        spentCents: rows
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amountCents, 0),
      };
    })
    .filter(({ period, count }) => !period.isUnassigned || count > 0)
    .reverse();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
        Quincenas
      </h1>

      {periods.length === 0 ? (
        <p className="text-sm text-[color:var(--text-soft)]">
          Marca tu primer día de cobro en Cobros y aquí van a aparecer tus quincenas.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {periods.map(({ period, spentCents, count }) => (
            <PeriodCard
              key={period.id}
              period={period}
              spentCents={spentCents}
              count={count}
            />
          ))}
        </div>
      )}
    </div>
  );
}
