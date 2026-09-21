import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findPeriodById, isDateInPeriod } from "@/lib/periods";
import { computeAgrupacionRecap, computePersonalRecap } from "@/lib/recap";
import { getPersonalBudgetCents } from "@/lib/settings";
import { generatePeriodPdf } from "@/lib/pdf";
import { computeSavingsInsights } from "@/lib/insights";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paydayId: string }> }
) {
  const { paydayId } = await params;
  const [paydays, transactions, limitCents] = await Promise.all([
    prisma.payday.findMany(),
    prisma.transaction.findMany({ orderBy: { date: "asc" } }),
    getPersonalBudgetCents(),
  ]);

  const period = findPeriodById(paydayId, paydays);
  if (!period) {
    return NextResponse.json({ error: "Quincena no encontrada" }, { status: 404 });
  }

  const periodTransactions = transactions.filter((t) => isDateInPeriod(t.date, period));
  const personalRecap = computePersonalRecap(periodTransactions, limitCents);
  const agrupacionRecap = computeAgrupacionRecap(periodTransactions);

  const insights = computeSavingsInsights({ transactions, paydays, limitCents });

  const buffer = await generatePeriodPdf({
    period,
    transactions: periodTransactions,
    personalRecap,
    agrupacionRecap,
    insights,
  });

  const filename = `quincena-${period.startDate ?? "inicio"}_${period.endDate ?? "hoy"}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
