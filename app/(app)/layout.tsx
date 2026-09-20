import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";

// Todas las páginas de este grupo leen datos por-request (sesión + Prisma);
// nunca deben prerenderizarse estáticamente en build.
export const dynamic = "force-dynamic";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses/new", label: "Agregar movimiento" },
  { href: "/periods", label: "Quincenas" },
  { href: "/calendar", label: "Calendario" },
  { href: "/settings", label: "Configuración" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="font-semibold text-zinc-900">
            DaytubaGastos
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-zinc-600 hover:text-zinc-900">
                {link.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button type="submit" className="text-zinc-600 hover:text-zinc-900">
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
