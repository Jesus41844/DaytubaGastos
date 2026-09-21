"use client";

import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function PaydayCalendar({ paydayDates }: { paydayDates: string[] }) {
  const dates = paydayDates.map(parseISODate);

  return (
    <DayPicker
      locale={es}
      modifiers={{ payday: dates }}
      modifiersClassNames={{ payday: "rdp-payday" }}
    />
  );
}
