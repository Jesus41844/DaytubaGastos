import { fromCents } from "@/lib/money";
import { getPersonalBudgetCents } from "@/lib/settings";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BudgetForm } from "@/components/BudgetForm";
import { logoutAction } from "@/lib/auth-actions";

export default async function SettingsPage() {
  const budgetCents = await getPersonalBudgetCents();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Configuración</h1>

      <Card className="max-w-md">
        <h2 className="mb-3 font-medium">Límite quincenal personal</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Contra este monto se compara lo que gastas en la categoría personal en cada
          quincena.
        </p>
        <BudgetForm defaultValue={fromCents(budgetCents)} />
      </Card>

      <Card className="max-w-md">
        <h2 className="mb-3 font-medium">Sesión</h2>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            Cerrar sesión
          </Button>
        </form>
      </Card>
    </div>
  );
}
