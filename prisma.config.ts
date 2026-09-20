import { defineConfig, env } from "@prisma/config";

// Prisma 7: `prisma migrate`/`studio` usan esta config (conexión directa,
// sin pgbouncer). El cliente en runtime (lib/db.ts) usa su propio adapter
// con la conexión pooled (DATABASE_URL).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
