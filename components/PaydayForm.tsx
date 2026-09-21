"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { createPayday, type PaydayFormState } from "@/app/(app)/calendar/actions";

const initialState: PaydayFormState = {};

export function PaydayForm() {
  const [state, formAction, isPending] = useActionState(createPayday, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label="¿Qué día cobras?" htmlFor="date" error={state.error}>
          <input id="date" name="date" type="date" required className={`${inputClass} figure`} />
        </Field>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Marcando…" : "Marcar"}
      </Button>
    </form>
  );
}
