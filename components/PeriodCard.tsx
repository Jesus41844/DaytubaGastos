import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/money";
import { periodLabel, type Period } from "@/lib/periods";

export function PeriodCard({ period, totalCents }: { period: Period; totalCents: number }) {
  return (
    <Link href={`/periods/${period.id}`}>
      <Card className="flex items-center justify-between transition-colors hover:border-zinc-400">
        <div>
          <p className="font-medium">{periodLabel(period)}</p>
          {period.isOngoing && <p className="text-xs text-emerald-600">En curso</p>}
        </div>
        <p className="font-medium">{formatCurrency(totalCents)}</p>
      </Card>
    </Link>
  );
}
