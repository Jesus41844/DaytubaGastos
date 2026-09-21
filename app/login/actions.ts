"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAppPasswordHash } from "@/lib/password";
import { loginSchema } from "@/lib/validations";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Contraseña inválida" };
  }

  const hash = getAppPasswordHash();
  if (!hash) {
    return {
      error:
        "Falta configurar APP_PASSWORD_HASH_B64 (hash en base64) o APP_PASSWORD_HASH (hash crudo) en el servidor",
    };
  }

  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!valid) {
    return { error: "Contraseña incorrecta" };
  }

  const session = await getSession();
  session.authenticated = true;
  await session.save();
  redirect("/dashboard");
}
