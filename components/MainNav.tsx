"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/periods", label: "Quincenas" },
  { href: "/calendar", label: "Cobros" },
  { href: "/ahorro", label: "Ahorro" },
  { href: "/settings", label: "Ajustes" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-scroll -mx-1 flex w-full gap-1 px-1 sm:w-auto sm:justify-end">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-lg px-2 py-1.5 text-xs whitespace-nowrap transition-colors sm:px-3 sm:text-sm",
              active
                ? "bg-[color:var(--card)] text-[color:var(--sea)]"
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
