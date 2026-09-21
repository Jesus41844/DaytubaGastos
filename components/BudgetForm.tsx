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
      <div className="flex-1">
        <Field label="Cuánto cobras" htmlFor="personalQuincenaBudget" error={state.error}>
          <div className="relative">
            <span className="figure pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[color:var(--text-soft)]">
              $
            </span>
            <input
              id="personalQuincenaBudget"
              name="personalQuincenaBudget"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue={defaultValue}
              required
              className={`${inputClass} figure pl-7`}
            />
          </div>
        </Field>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
      {state.success && <p className="text-sm text-[color:var(--sea)]">Guardado.</p>}
    </form>
  );
}
