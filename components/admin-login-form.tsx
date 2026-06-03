"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, type AdminLoginResult } from "@/lib/actions/admin";

async function action(_prev: AdminLoginResult | null, formData: FormData) {
  return adminLogin(formData);
}

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminLoginResult | null, FormData>(
    action,
    null
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.push("/admin/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-2">
          Senha
        </label>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="w-full bg-graphite border border-rule px-4 py-4 text-bone font-mono text-lg tracking-wider focus:border-acid focus:outline-none"
        />
      </div>
      {state && !state.ok && (
        <div className="text-warning text-sm font-mono uppercase tracking-wide">
          ↳ {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-pitch border border-acid text-acid font-display text-xl font-extrabold uppercase tracking-wider py-4 hover:bg-acid hover:text-black transition disabled:opacity-50"
      >
        {pending ? "Verificando..." : "Entrar →"}
      </button>
    </form>
  );
}
