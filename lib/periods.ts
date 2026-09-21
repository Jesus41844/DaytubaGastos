import { todayInTimezone } from "./dates";

export type PaydayInput = { id: string; date: string };

export type Period = {
  id: string; // id del Payday que abre el periodo, o "unassigned"
  startDate: string | null; // ISO "YYYY-MM-DD", null solo para "unassigned" sin paydays
  endDate: string | null; // null = periodo en curso (o "unassigned" sin límite superior)
  isOngoing: boolean;
  isUnassigned: boolean;
};

export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return todayInTimezone();
}

export function diffDaysISO(from: string, to: string): number {
  const parse = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

export type PeriodProgress = {
  dayNumber: number; // día del periodo en el que cae `date` (1-indexado)
  totalDays: number;
  daysLeft: number; // incluye hoy
};

/**
 * Posición de una fecha dentro del periodo. Devuelve null si el periodo no
 * tiene cierre conocido (aún no se marcó el siguiente cobro), porque sin eso
 * no se puede saber cuántos días abarca.
 */
export function getPeriodProgress(period: Period, date: string): PeriodProgress | null {
  if (period.startDate === null || period.endDate === null) return null;

  const totalDays = diffDaysISO(period.startDate, period.endDate) + 1;
  const dayNumber = Math.min(Math.max(diffDaysISO(period.startDate, date) + 1, 1), totalDays);
  return { dayNumber, totalDays, daysLeft: totalDays - dayNumber + 1 };
}

function sortPaydays(paydays: PaydayInput[]): PaydayInput[] {
  return [...paydays].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Deriva los periodos (quincenas) a partir de las fechas de cobro guardadas.
 * No hay tabla de "periodo": los rangos se recalculan siempre desde `Payday`,
 * así que editar/borrar una fecha de cobro reconfigura los rangos automáticamente.
 */
export function getPeriods(paydays: PaydayInput[]): Period[] {
  const sorted = sortPaydays(paydays);
  return sorted.map((p, i) => {
    const next = sorted[i + 1];
    return {
      id: p.id,
      startDate: p.date,
      endDate: next ? addDaysISO(next.date, -1) : null,
      isOngoing: !next,
      isUnassigned: false,
    };
  });
}

const UNASSIGNED: Omit<Period, "endDate"> = {
  id: "unassigned",
  startDate: null,
  isOngoing: false,
  isUnassigned: true,
};

/**
 * Ubica a qué periodo pertenece una fecha. Fechas anteriores al primer payday
 * registrado (o cuando aún no hay ningún payday) caen en el bucket "unassigned".
 */
export function findPeriodForDate(date: string, paydays: PaydayInput[]): Period {
  const periods = getPeriods(paydays);
  const match = periods.find(
    (p) => p.startDate !== null && date >= p.startDate && (p.endDate === null || date <= p.endDate)
  );
  if (match) return match;

  const first = periods[0];
  return {
    ...UNASSIGNED,
    endDate: first ? addDaysISO(first.startDate as string, -1) : null,
  };
}

export function findPeriodById(paydayId: string, paydays: PaydayInput[]): Period | null {
  return getAllPeriods(paydays).find((p) => p.id === paydayId) ?? null;
}

/** Todos los periodos en orden cronológico, incluyendo el bucket "unassigned" al inicio. */
export function getAllPeriods(paydays: PaydayInput[]): Period[] {
  const periods = getPeriods(paydays);
  const first = periods[0];
  const unassigned: Period = {
    ...UNASSIGNED,
    endDate: first ? addDaysISO(first.startDate as string, -1) : null,
  };
  return [unassigned, ...periods];
}

export function periodLabel(period: Period): string {
  if (period.isUnassigned) {
    return period.endDate
      ? `Antes de ${addDaysISO(period.endDate, 1)}`
      : "Todos los movimientos (sin fechas de cobro registradas)";
  }
  return `${period.startDate} → ${period.endDate ?? "hoy (en curso)"}`;
}

export function isDateInPeriod(date: string, period: Period): boolean {
  if (period.isUnassigned) {
    return period.endDate === null || date <= period.endDate;
  }
  if (period.startDate === null) return false;
  return date >= period.startDate && (period.endDate === null || date <= period.endDate);
}
