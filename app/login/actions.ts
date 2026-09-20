"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Contraseña inválida" };
  }

  const hash = process.env.APP_PASSWORD_HASH;
  if (!hash) {
    return { error: "APP_PASSWORD_HASH no está configurado en el servidor" };
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
