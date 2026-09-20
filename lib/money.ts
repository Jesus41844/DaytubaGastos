// Cambia estos dos valores si tu moneda o locale es distinto.
const LOCALE = "es-PA";
const CURRENCY = "USD";

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));
}
