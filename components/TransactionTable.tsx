import Link from "next/link";
import { formatAmount } from "@/lib/money";
import { formatDayMonth } from "@/lib/dates";

export type TransactionRow = {
  id: string;
  date: string;
  concept: string;
  category: string;
  type: string;
  amountCents: number;
};

export function TransactionTable({
  transactions,
  emptyMessage = "Todavía no anotas nada aquí.",
}: {
  transactions: TransactionRow[];
  emptyMessage?: string;
}) {
  if (transactions.length === 0) {
    return <p className="py-2 text-sm text-[color:var(--text-soft)]">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-[color:var(--line)]">
      {transactions.map((t) => {
        const isIncome = t.type === "income";
        return (
          <li key={t.id}>
            <Link
              href={`/expenses/${t.id}/edit`}
              className="flex items-baseline gap-3 py-3 transition-colors hover:bg-[color:var(--surface)]"
            >
              <span className="figure w-14 shrink-0 text-xs text-[color:var(--text-soft)]">
                {formatDayMonth(t.date)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {t.concept}
                {t.category === "agrupacion" && (
                  <span className="eyebrow ml-2 !text-[color:var(--ochre)]">GREB</span>
                )}
              </span>
              <span
                className={`figure shrink-0 text-sm ${
                  isIncome ? "text-[color:var(--sea)]" : "text-[color:var(--text)]"
                }`}
              >
                {isIncome ? "+" : "−"}${formatAmount(t.amountCents)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
