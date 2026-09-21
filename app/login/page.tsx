"use client";

import { useActionState, useEffect, useRef } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const passwordRef = useRef<HTMLInputElement>(null);

  // `autoFocus` en el JSX provoca un hydration mismatch: el servidor emite el
  // atributo y el cliente lo maneja como propiedad.
  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-center bg-[color:var(--deep)] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-sm">
        <p className="eyebrow !text-white/50">Tus gastos, por quincena</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-none font-extrabold tracking-tight">
          Gastos
        </h1>

        <form action={formAction} className="mt-10 flex flex-col gap-3">
          <label htmlFor="password" className="text-sm text-white/70">
            Tu contraseña
          </label>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
          />
          {state.error && <p className="text-sm text-[color:var(--coral)]">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-[color:var(--deep)] transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {isPending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
