import { prisma } from "./db";

const BUDGET_KEY = "personalQuincenaBudgetCents";

export async function getPersonalBudgetCents(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: BUDGET_KEY } });
  return setting ? Number(setting.value) : 0;
}

export async function setPersonalBudgetCents(cents: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: BUDGET_KEY },
    create: { key: BUDGET_KEY, value: String(cents) },
    update: { value: String(cents) },
  });
}
