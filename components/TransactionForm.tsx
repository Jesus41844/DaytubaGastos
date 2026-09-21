"use client";

import { useActionState, useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { todayInTimezone } from "@/lib/dates";
import type { TransactionFormState } from "@/app/(app)/expenses/actions";

export type TransactionDefaults = {
  amount: number;
  concept: string;
  category: string;
  type: string;
  date: string;
  notes: string;
};

function Choice({
  value,
  current,
  onSelect,
  children,
}: {
  value: string;
  current: string;
  onSelect: (value: string) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={clsx(
        "flex-1 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        active
          ? "border-[color:var(--sea)] bg-[color:var(--sea)] text-[color:var(--surface)]"
          : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--text-soft)] hover:border-[color:var(--sea)]"
      )}
    >
      {children}
    </button>
  );
}

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
  const [type, setType] = useState(defaultValues?.type ?? "expense");
  const today = todayInTimezone();

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="¿Cuánto?" htmlFor="amount">
        <div className="relative">
          <span className="figure pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[color:var(--text-soft)]">
            $
          </span>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue={defaultValues?.amount}
            required
            className={`${inputClass} figure pl-7 text-lg`}
          />
        </div>
      </Field>

      <Field label="¿En qué?" htmlFor="concept">
        <input
          id="concept"
          name="concept"
          type="text"
          placeholder="Supermercado"
          defaultValue={defaultValues?.concept}
          required
          className={inputClass}
        />
      </Field>

      <Field label="¿Qué día?" htmlFor="date">
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultValues?.date ?? today}
          required
          className={`${inputClass} figure`}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">¿De quién sale?</span>
        <div className="flex gap-2">
          <Choice value="personal" current={category} onSelect={setCategory}>
            Mío
          </Choice>
          <Choice value="agrupacion" current={category} onSelect={setCategory}>
            De GREB
          </Choice>
        </div>
        <input type="hidden" name="category" value={category} />
      </div>

      {category === "agrupacion" ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">¿Entra o sale?</span>
          <div className="flex gap-2">
            <Choice value="expense" current={type} onSelect={setType}>
              Sale (gasto)
            </Choice>
            <Choice value="income" current={type} onSelect={setType}>
              Entra (ingreso)
            </Choice>
          </div>
          <input type="hidden" name="type" value={type} />
        </div>
      ) : (
        <input type="hidden" name="type" value="expense" />
      )}

      <Field label="Nota" htmlFor="notes" hint="Opcional.">
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes}
          className={inputClass}
        />
      </Field>

      {state.error && <p className="text-sm text-[color:var(--coral)]">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="py-3">
        {isPending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
