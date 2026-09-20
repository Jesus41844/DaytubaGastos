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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Editar movimiento</h1>
      <Card className="max-w-lg">
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
        <form action={boundDelete} className="mt-4 border-t border-zinc-200 pt-4">
          <Button type="submit" variant="danger">
            Eliminar movimiento
          </Button>
        </form>
      </Card>
    </div>
  );
}
