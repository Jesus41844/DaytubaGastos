"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { paydaySchema } from "@/lib/validations";

export type PaydayFormState = { error?: string };

function revalidateAll() {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/periods");
}

export async function createPayday(
  _prevState: PaydayFormState,
  formData: FormData
): Promise<PaydayFormState> {
  const parsed = paydaySchema.safeParse({ date: formData.get("date") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Fecha inválida" };
  }

  try {
    await prisma.payday.create({ data: { date: parsed.data.date } });
  } catch {
    return { error: "Ya existe una fecha de cobro registrada ese día" };
  }

  revalidateAll();
  return {};
}

export async function deletePayday(id: string): Promise<void> {
  await prisma.payday.delete({ where: { id } });
  revalidateAll();
}
