import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[color:var(--text)]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[color:var(--text-soft)]">{hint}</p>}
      {error && <p className="text-sm text-[color:var(--coral)]">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-soft)] focus:border-[color:var(--sea)] focus:outline-none";
