import Link from "next/link";
import { formatCurrency } from "@/lib/money";
import { formatDayMonth } from "@/lib/dates";
import { periodLabel, type Period } from "@/lib/periods";

export function PeriodCard({
  period,
  spentCents,
  count,
}: {
  period: Period;
  spentCents: number;
  count: number;
}) {
  const label = period.isUnassigned
    ? periodLabel(period)
    : `${formatDayMonth(period.startDate as string)} — ${
        period.endDate ? formatDayMonth(period.endDate) : "hoy"
      }`;

  return (
    <Link
      href={`/periods/${period.id}`}
      className="flex items-center justify-between rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-5 py-4 transition-colors hover:border-[color:var(--sea)]"
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-[color:var(--text-soft)]">
          {count === 0 ? "Sin movimientos" : `${count} movimiento${count === 1 ? "" : "s"}`}
          {period.isOngoing && " · en curso"}
        </p>
      </div>
      <span className="figure text-sm">{formatCurrency(spentCents)}</span>
    </Link>
  );
}
