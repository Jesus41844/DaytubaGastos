"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { toCents } from "@/lib/money";
import { transactionSchema } from "@/lib/validations";

export type TransactionFormState = { error?: string };

function parseTransaction(formData: FormData) {
  return transactionSchema.safeParse({
    amount: formData.get("amount"),
    concept: formData.get("concept"),
    category: formData.get("category"),
    type: formData.get("type"),
    date: formData.get("date"),
    notes: formData.get("notes"),
  });
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/periods");
}

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const parsed = parseTransaction(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  await prisma.transaction.create({
    data: {
      amountCents: toCents(data.amount),
      concept: data.concept,
      category: data.category,
      type: data.category === "personal" ? "expense" : data.type,
      date: data.date,
      notes: data.notes || null,
    },
  });

  revalidateAll();
  redirect("/dashboard");
}

export async function updateTransaction(
  id: string,
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const parsed = parseTransaction(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  await prisma.transaction.update({
    where: { id },
    data: {
      amountCents: toCents(data.amount),
      concept: data.concept,
      category: data.category,
      type: data.category === "personal" ? "expense" : data.type,
      date: data.date,
      notes: data.notes || null,
    },
  });

  revalidateAll();
  redirect("/periods");
}

export async function deleteTransaction(id: string): Promise<void> {
  await prisma.transaction.delete({ where: { id } });
  revalidateAll();
  redirect("/periods");
}
