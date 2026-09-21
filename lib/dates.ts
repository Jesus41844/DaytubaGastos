/**
 * El servidor (Vercel) corre en UTC, así que sin fijar la zona la app cree que
 * ya es mañana desde las 7pm en Panamá: cambiaría de quincena y pondría la
 * fecha equivocada por defecto al anotar un gasto.
 */
export const TIMEZONE = "America/Panama";

/** Fecha de hoy en Panamá como ISO "YYYY-MM-DD". */
export function todayInTimezone(now: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(now);
}

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** "2026-09-05" → "05 sep" */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]}`;
}

/** "2026-09-05" → "05 sep 2026" */
export function formatFullDate(iso: string): string {
  const [y] = iso.split("-");
  return `${formatDayMonth(iso)} ${y}`;
}
