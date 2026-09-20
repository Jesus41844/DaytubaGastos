"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { createPayday, type PaydayFormState } from "@/app/(app)/calendar/actions";

const initialState: PaydayFormState = {};

export function PaydayForm() {
  const [state, formAction, isPending] = useActionState(createPayday, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="Fecha de cobro" htmlFor="date" error={state.error}>
        <input id="date" name="date" type="date" required className={inputClass} />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Agregar fecha de cobro"}
      </Button>
    </form>
  );
}
