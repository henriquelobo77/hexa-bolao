"use client";

import { useActionState, useState } from "react";
import { adminCreateBolao } from "@/lib/actions/admin";

type R = { ok: true } | { ok: false; error: string };

async function action(_prev: R | null, formData: FormData) {
  return adminCreateBolao(formData) as Promise<R>;
}

export function AdminCreateBolaoForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<R | null, FormData>(action, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-3 hover:bg-acid hover:text-black transition"
      >
        + Criar outro bolão
      </button>
    );
  }

  return (
    <div className="border border-rule p-4 space-y-3 bg-graphite/40">
      <div className="flex items-baseline justify-between">
        <div className="font-display text-lg font-bold uppercase tracking-tight">
          Novo bolão
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-bone"
        >
          fechar ×
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted md:col-span-2">
          Nome
          <input
            name="name"
            required
            maxLength={64}
            placeholder="Galera do Trampo"
            className="bg-pitch-deep border border-rule px-3 py-2 text-bone text-base focus:border-acid focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted">
          Slug (URL)
          <input
            name="slug"
            required
            maxLength={64}
            pattern="[a-z0-9-]+"
            placeholder="galera-do-trampo"
            className="bg-pitch-deep border border-rule px-3 py-2 text-bone font-mono text-sm focus:border-acid focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted">
          Código de entrada
          <input
            name="join_code"
            required
            maxLength={32}
            placeholder="HEXA2026"
            className="bg-pitch-deep border border-rule px-3 py-2 text-bone font-mono text-sm uppercase tracking-wider focus:border-acid focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted">
          Senha admin
          <input
            type="password"
            name="admin_password"
            required
            minLength={4}
            className="bg-pitch-deep border border-rule px-3 py-2 text-bone font-mono text-sm focus:border-acid focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted">
          Cap de membros (opc.)
          <input
            type="number"
            name="max_members"
            min={1}
            max={10000}
            placeholder="30"
            className="bg-pitch-deep border border-rule px-3 py-2 text-bone font-mono text-sm focus:border-acid focus:outline-none"
          />
        </label>
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-2.5 hover:bg-acid hover:text-black transition disabled:opacity-40"
          >
            {pending ? "Criando..." : "Criar bolão →"}
          </button>
          {state?.ok && (
            <span className="text-acid text-xs font-mono uppercase">↳ Criado</span>
          )}
          {state && !state.ok && (
            <span className="text-warning text-xs font-mono uppercase">↳ {state.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}
