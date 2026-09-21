// Panamá usa el dólar; se escribe con `$`, no con el código ISO.
const LOCALE = "es-PA";
const SYMBOL = "$";

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Solo la cifra, sin símbolo: para alinear columnas o poner el `$` aparte. */
export function formatAmount(cents: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));
}

export function formatCurrency(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}${SYMBOL}${formatAmount(Math.abs(cents))}`;
}
