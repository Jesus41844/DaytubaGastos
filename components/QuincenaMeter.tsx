import Link from "next/link";
import { formatAmount, formatCurrency } from "@/lib/money";
import type { PeriodProgress } from "@/lib/periods";
import type { PersonalRecap } from "@/lib/recap";

/**
 * Pone plata y tiempo sobre el mismo eje: el relleno es cuánto llevas gastado
 * del límite, la marca blanca es dónde cae hoy dentro de la quincena. Si el
 * relleno va por delante de la marca, estás gastando más rápido que los días.
 */
export function QuincenaMeter({
  recap,
  progress,
}: {
  recap: PersonalRecap;
  progress: PeriodProgress | null;
}) {
  const overspent = recap.remainingCents < 0;

  if (recap.limitCents === 0) {
    return (
      <div className="rounded-lg border border-white/20 p-4 text-sm text-white/70">
        Pon tu límite de quincena en{" "}
        <Link href="/settings" className="text-white underline underline-offset-4">
          Ajustes
        </Link>{" "}
        y aquí vas a ver cuánto te queda.
      </div>
    );
  }

  const fillPct = Math.min(recap.spentCents / recap.limitCents, 1) * 100;
  const todayPct = progress ? (progress.dayNumber / progress.totalDays) * 100 : null;
  const perDayCents = progress && !overspent ? Math.floor(recap.remainingCents / progress.daysLeft) : null;
  const aheadOfPace = todayPct !== null && fillPct > todayPct;

  return (
    <div>
      <div className="meter-track">
        <div
          className={`meter-fill ${overspent || aheadOfPace ? "meter-fill--over" : ""}`}
          style={{
            width: `${fillPct}%`,
            background: overspent || aheadOfPace ? undefined : "var(--sea)",
          }}
        />
        {todayPct !== null && (
          <div className="meter-today" style={{ left: `calc(${todayPct}% - 1px)` }} aria-hidden />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-sm text-white/70">
          Llevas <span className="figure text-white">{formatCurrency(recap.spentCents)}</span> de{" "}
          <span className="figure text-white">{formatCurrency(recap.limitCents)}</span>
        </p>
        {progress ? (
          <p className="eyebrow !text-white/60">
            Día {progress.dayNumber} de {progress.totalDays}
          </p>
        ) : (
          <p className="text-sm text-white/60">
            <Link href="/calendar" className="text-white underline underline-offset-4">
              Marca tu próximo cobro
            </Link>{" "}
            para ver el ritmo
          </p>
        )}
      </div>

      {perDayCents !== null && (
        <p className="mt-4 border-t border-white/15 pt-4 text-sm text-white/70">
          Te quedan <span className="figure text-white">${formatAmount(perDayCents)}</span> por día
          {progress && progress.daysLeft > 1 ? ` durante ${progress.daysLeft} días` : " para hoy"}.
        </p>
      )}

      {aheadOfPace && !overspent && (
        <p className="mt-2 text-sm text-[color:var(--coral)]">
          Vas gastando más rápido que los días que quedan.
        </p>
      )}
    </div>
  );
}
