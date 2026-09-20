import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PaydayCalendar } from "@/components/PaydayCalendar";
import { PaydayForm } from "@/components/PaydayForm";
import { deletePayday } from "./actions";

export default async function CalendarPage() {
  const paydays = await prisma.payday.findMany({ orderBy: { date: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Fechas de cobro</h1>
      <p className="text-sm text-zinc-500">
        Cada fecha que agregues aquí abre una nueva quincena. No hay patrón automático:
        tú decides cuándo empieza cada periodo.
      </p>

      <Card className="max-w-sm">
        <PaydayForm />
      </Card>

      <Card className="w-fit">
        <PaydayCalendar paydayDates={paydays.map((p) => p.date)} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Fechas registradas</h2>
        {paydays.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no agregas ninguna fecha de cobro.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {paydays
              .slice()
              .reverse()
              .map((p) => {
                const boundDelete = deletePayday.bind(null, p.id);
                return (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.date}</span>
                    <form action={boundDelete}>
                      <Button type="submit" variant="ghost" className="text-red-600 hover:bg-red-50">
                        Eliminar
                      </Button>
                    </form>
                  </li>
                );
              })}
          </ul>
        )}
      </Card>
    </div>
  );
}
