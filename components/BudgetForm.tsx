"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { updateBudget, type SettingsFormState } from "@/app/(app)/settings/actions";

const initialState: SettingsFormState = {};

export function BudgetForm({ defaultValue }: { defaultValue: number }) {
  const [state, formAction, isPending] = useActionState(updateBudget, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field label="Límite quincenal personal" htmlFor="personalQuincenaBudget" error={state.error}>
        <input
          id="personalQuincenaBudget"
          name="personalQuincenaBudget"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValue}
          required
          className={inputClass}
        />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar límite"}
      </Button>
      {state.success && <p className="text-sm text-emerald-600">Guardado.</p>}
    </form>
  );
}
