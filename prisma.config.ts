import { defineConfig, env } from "@prisma/config";

// El CLI de Prisma solo carga `.env` automáticamente, no `.env.local`
// (convención de Next.js). Lo cargamos a mano para desarrollo local; en
// Vercel las env vars ya vienen inyectadas y este archivo no existe.
try {
  process.loadEnvFile(".env.local");
} catch {
  // sin .env.local (ej. en producción) — las env vars ya están en el entorno
}

// Prisma 7: `prisma migrate`/`studio` usan esta config (conexión directa,
// sin pgbouncer). El cliente en runtime (lib/db.ts) usa su propio adapter
// con la conexión pooled (DATABASE_URL).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
