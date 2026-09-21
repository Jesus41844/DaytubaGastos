import { Card } from "@/components/ui/Card";
import { TransactionForm } from "@/components/TransactionForm";
import { createTransaction } from "../actions";

export default function NewExpensePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
        Anotar un gasto
      </h1>
      <Card>
        <TransactionForm action={createTransaction} submitLabel="Guardar" />
      </Card>
    </div>
  );
}
