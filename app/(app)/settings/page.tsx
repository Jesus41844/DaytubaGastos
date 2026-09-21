import { fromCents } from "@/lib/money";
import { getPersonalBudgetCents } from "@/lib/settings";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BudgetForm } from "@/components/BudgetForm";
import { logoutAction } from "@/lib/auth-actions";

export default async function SettingsPage() {
  const budgetCents = await getPersonalBudgetCents();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
        Ajustes
      </h1>

      <Card>
        <h2 className="eyebrow">Tu quincena</h2>
        <p className="mt-3 text-sm text-[color:var(--text-soft)]">
          Lo que cobras cada quincena. Contra este monto se mide lo que gastas de lo tuyo.
        </p>
        <div className="mt-4">
          <BudgetForm defaultValue={fromCents(budgetCents)} />
        </div>
      </Card>

      <Card>
        <h2 className="eyebrow">Sesión</h2>
        <form action={logoutAction} className="mt-3">
          <Button type="submit" variant="secondary">
            Cerrar sesión
          </Button>
        </form>
      </Card>
    </div>
  );
}
