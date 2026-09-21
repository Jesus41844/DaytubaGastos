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

/** La losa: en oscuro es la superficie más clara de la página. */
export function DeepCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[color:var(--line)] bg-[color:var(--deep)] p-6 text-[color:var(--on-deep)] sm:p-8",
        className
      )}
      {...props}
    />
  );
}
