"use server";

import { revalidatePath } from "next/cache";
import { toCents } from "@/lib/money";
import { setPersonalBudgetCents } from "@/lib/settings";
import { settingsSchema } from "@/lib/validations";

export type SettingsFormState = { error?: string; success?: boolean };

export async function updateBudget(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const parsed = settingsSchema.safeParse({
    personalQuincenaBudget: formData.get("personalQuincenaBudget"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Valor inválido" };
  }

  await setPersonalBudgetCents(toCents(parsed.data.personalQuincenaBudget));

  revalidatePath("/dashboard");
  revalidatePath("/periods");
  revalidatePath("/settings");
  return { success: true };
}
