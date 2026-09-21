import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "onDeep";

const variants: Record<Variant, string> = {
  primary: "bg-[color:var(--deep)] text-white hover:bg-[color:var(--deep-soft)]",
  secondary:
    "bg-white text-[color:var(--text)] border border-[color:var(--line)] hover:border-[color:var(--deep)]",
  danger: "bg-[color:var(--coral)] text-white hover:brightness-95",
  ghost: "text-[color:var(--text-soft)] hover:text-[color:var(--text)]",
  onDeep: "bg-white text-[color:var(--deep)] hover:bg-white/90",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
