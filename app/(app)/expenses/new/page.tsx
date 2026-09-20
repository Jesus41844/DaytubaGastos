import { Card } from "@/components/ui/Card";
import { TransactionForm } from "@/components/TransactionForm";
import { createTransaction } from "../actions";

export default function NewExpensePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Agregar movimiento</h1>
      <Card className="max-w-lg">
        <TransactionForm action={createTransaction} submitLabel="Guardar" />
      </Card>
    </div>
  );
}
