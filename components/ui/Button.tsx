import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  // Sobre fondo oscuro lo más brillante debe ser la acción principal.
  primary: "bg-[color:var(--sea)] text-[color:var(--surface)] hover:brightness-110",
  secondary:
    "bg-[color:var(--card)] text-[color:var(--text)] border border-[color:var(--line)] hover:border-[color:var(--sea)]",
  danger: "bg-[color:var(--coral)] text-[color:var(--surface)] hover:brightness-110",
  ghost: "text-[color:var(--text-soft)] hover:text-[color:var(--text)]",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
