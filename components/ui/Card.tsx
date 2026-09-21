import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] p-5",
        className
      )}
      {...props}
    />
  );
}

/** La losa verde profunda: el único bloque con peso visual de la página. */
export function DeepCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl bg-[color:var(--deep)] p-6 text-white sm:p-8", className)}
      {...props}
    />
  );
}
