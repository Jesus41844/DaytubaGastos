# DaytubaGastos

Control de gastos por quincena. Las quincenas no son cada 15 días fijos: se
definen a mano agregando fechas de cobro en `/calendar`. Separa **Personal**
(límite quincenal fijo, solo gastos) de **Agrupación** (ingresos y gastos,
balance variable). Al cerrar una quincena genera un PDF con el detalle y el
recap.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind · Prisma 7 + PostgreSQL
(Supabase) · iron-session + bcryptjs (login con contraseña única) ·
react-day-picker · @react-pdf/renderer · vitest.

## Desarrollo local

1. Crea un proyecto en [Supabase](https://supabase.com) (plan gratuito). En
   *Project Settings → Database* copia:
   - la conexión **pooled** (Transaction pooler, puerto 6543) → `DATABASE_URL`
   - la conexión **directa** (puerto 5432) → `DIRECT_URL`
2. Copia `.env.example` a `.env.local` y completa `DATABASE_URL`, `DIRECT_URL`,
   `APP_PASSWORD_HASH` y `SESSION_SECRET` (instrucciones para generarlos están
   en el propio archivo).
3. Instala dependencias y aplica el esquema:
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```
4. Corre el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Corre los tests (lógica de quincenas y recap):
   ```bash
   npm test
   ```

## Deploy (Vercel + Supabase)

1. Conecta el repo en [Vercel](https://vercel.com/new) (o `vercel --prod` desde
   la CLI) y carga las mismas 4 variables de entorno en el dashboard del
   proyecto.
2. El build usa el script `vercel-build` (`prisma generate && prisma migrate
   deploy && next build`), que Vercel detecta y corre automáticamente.
3. Vercel da un dominio `*.vercel.app` con HTTPS listo para abrir desde el
   celular.
