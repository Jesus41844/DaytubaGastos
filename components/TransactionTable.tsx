import Link from "next/link";
import { formatCurrency } from "@/lib/money";

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
  editable = true,
}: {
  transactions: TransactionRow[];
  editable?: boolean;
}) {
  if (transactions.length === 0) {
    return <p className="text-sm text-zinc-500">Sin movimientos.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 text-left text-zinc-500">
          <th className="py-2 pr-2 font-medium">Fecha</th>
          <th className="py-2 pr-2 font-medium">Concepto</th>
          <th className="py-2 pr-2 font-medium">Categoría</th>
          <th className="py-2 pr-2 font-medium">Tipo</th>
          <th className="py-2 pr-2 text-right font-medium">Monto</th>
          {editable && <th className="py-2" />}
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id} className="border-b border-zinc-100">
            <td className="py-2 pr-2 whitespace-nowrap">{t.date}</td>
            <td className="py-2 pr-2">{t.concept}</td>
            <td className="py-2 pr-2">{t.category === "personal" ? "Personal" : "Agrupación"}</td>
            <td className="py-2 pr-2">{t.type === "income" ? "Ingreso" : "Gasto"}</td>
            <td className="py-2 pr-2 text-right whitespace-nowrap">{formatCurrency(t.amountCents)}</td>
            {editable && (
              <td className="py-2 text-right whitespace-nowrap">
                <Link href={`/expenses/${t.id}/edit`} className="text-zinc-500 hover:text-zinc-900">
                  Editar
                </Link>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
