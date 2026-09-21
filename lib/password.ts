/**
 * El hash de bcrypt contiene `$`, que el parser de `.env` de Next.js
 * (dotenv-expand) corrompe silenciosamente. Por eso en archivos `.env` se
 * guarda en base64 (`APP_PASSWORD_HASH_B64`). En plataformas que inyectan las
 * variables directo al entorno (Vercel) no hay parser de por medio, así que
 * también se acepta el hash crudo en `APP_PASSWORD_HASH`.
 */
export function getAppPasswordHash(): string | null {
  const b64 = process.env.APP_PASSWORD_HASH_B64;
  if (b64) return Buffer.from(b64, "base64").toString("utf-8");

  const raw = process.env.APP_PASSWORD_HASH;
  // Un hash bcrypt íntegro siempre empieza con `$2`; si no, llegó corrompido.
  if (raw?.startsWith("$2")) return raw;

  return null;
}
