"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/periods", label: "Quincenas" },
  { href: "/calendar", label: "Cobros" },
  { href: "/settings", label: "Ajustes" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full justify-between gap-1 sm:w-auto sm:justify-end">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors sm:px-3",
              active
                ? "bg-[color:var(--deep)] text-white"
                : "text-[color:var(--text-soft)] hover:text-[color:var(--text)]"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
