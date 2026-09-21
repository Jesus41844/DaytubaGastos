import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PaydayCalendar } from "@/components/PaydayCalendar";
import { PaydayForm } from "@/components/PaydayForm";
import { formatFullDate } from "@/lib/dates";
import { deletePayday } from "./actions";

export default async function CalendarPage() {
  const paydays = await prisma.payday.findMany({ orderBy: { date: "asc" } });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Cobros
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-soft)]">
          Marca el día que cobras. Cada marca abre una quincena nueva y cierra la anterior.
          Marca también el próximo para ver cuánto te queda por día.
        </p>
      </div>

      <Card>
        <PaydayForm />
      </Card>

      <Card className="flex justify-center">
        <PaydayCalendar paydayDates={paydays.map((p) => p.date)} />
      </Card>

      <Card>
        <h2 className="eyebrow">Días marcados</h2>
        {paydays.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--text-soft)]">
            Todavía no marcas ningún cobro.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[color:var(--line)]">
            {paydays
              .slice()
              .reverse()
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <span className="figure text-sm">{formatFullDate(p.date)}</span>
                  <form action={deletePayday.bind(null, p.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      className="!text-[color:var(--coral)] px-0 text-xs"
                    >
                      Quitar
                    </Button>
                  </form>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
