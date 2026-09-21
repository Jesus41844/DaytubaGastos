import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fromCents } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TransactionForm } from "@/components/TransactionForm";
import { deleteTransaction, updateTransaction } from "../../actions";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) notFound();

  const boundUpdate = updateTransaction.bind(null, id);
  const boundDelete = deleteTransaction.bind(null, id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
        Editar
      </h1>
      <Card>
        <TransactionForm
          action={boundUpdate}
          submitLabel="Guardar cambios"
          defaultValues={{
            amount: fromCents(transaction.amountCents),
            concept: transaction.concept,
            category: transaction.category,
            type: transaction.type,
            date: transaction.date,
            notes: transaction.notes ?? "",
          }}
        />
      </Card>
      <form action={boundDelete}>
        <Button type="submit" variant="ghost" className="!text-[color:var(--coral)] px-0">
          Borrar este movimiento
        </Button>
      </form>
    </div>
  );
}
