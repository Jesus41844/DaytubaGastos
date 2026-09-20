"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import type { TransactionFormState } from "@/app/(app)/expenses/actions";

export type TransactionDefaults = {
  amount: number;
  concept: string;
  category: string;
  type: string;
  date: string;
  notes: string;
};

export function TransactionForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
  defaultValues?: TransactionDefaults;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [category, setCategory] = useState(defaultValues?.category ?? "personal");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Monto" htmlFor="amount">
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.amount}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Concepto / producto" htmlFor="concept">
        <input
          id="concept"
          name="concept"
          type="text"
          defaultValue={defaultValues?.concept}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Fecha" htmlFor="date">
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultValues?.date ?? today}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Categoría" htmlFor="category">
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="personal">Personal</option>
          <option value="agrupacion">Agrupación</option>
        </select>
      </Field>

      {category === "agrupacion" ? (
        <Field label="Tipo" htmlFor="type">
          <select id="type" name="type" defaultValue={defaultValues?.type ?? "expense"} className={inputClass}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </Field>
      ) : (
        <input type="hidden" name="type" value="expense" />
      )}

      <Field label="Notas (opcional)" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes}
          className={inputClass}
        />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
