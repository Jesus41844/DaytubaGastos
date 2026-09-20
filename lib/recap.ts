export type TransactionLike = {
  amountCents: number;
  category: string;
  type: string;
};

export type PersonalRecap = {
  spentCents: number;
  limitCents: number;
  remainingCents: number;
};

export type AgrupacionRecap = {
  incomeCents: number;
  expensesCents: number;
  balanceCents: number;
};

export function computePersonalRecap(
  transactions: TransactionLike[],
  limitCents: number
): PersonalRecap {
  const spentCents = transactions
    .filter((t) => t.category === "personal")
    .reduce((sum, t) => sum + t.amountCents, 0);
  return { spentCents, limitCents, remainingCents: limitCents - spentCents };
}

export function computeAgrupacionRecap(transactions: TransactionLike[]): AgrupacionRecap {
  const agrupacion = transactions.filter((t) => t.category === "agrupacion");
  const incomeCents = agrupacion
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amountCents, 0);
  const expensesCents = agrupacion
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amountCents, 0);
  return { incomeCents, expensesCents, balanceCents: incomeCents - expensesCents };
}
