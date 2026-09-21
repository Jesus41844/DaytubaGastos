import Link from "next/link";
import { MainNav } from "@/components/MainNav";

// Todas las páginas de este grupo leen datos por-request (sesión + Prisma);
// nunca deben prerenderizarse estáticamente en build.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[color:var(--line)] bg-[color:var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="hidden font-[family-name:var(--font-display)] text-base font-extrabold tracking-tight sm:block"
          >
            Gastos
          </Link>
          <MainNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
