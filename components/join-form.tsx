"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { joinBolao, type JoinResult } from "@/lib/actions/member";

async function action(_prev: JoinResult | null, formData: FormData) {
  return joinBolao(formData);
}

interface JoinFormProps {
  presetCode?: string;
}

export function JoinForm({ presetCode = "HEXA2026" }: JoinFormProps) {
  const [state, formAction, pending] = useActionState<JoinResult | null, FormData>(
    action,
    null
  );
  const router = useRouter();
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      // Redireciona pro bolão usando o slug (que = join_code uppercase no nosso seed)
      router.push(`/b/${state.bolaoSlug}`);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="code"
          className="block text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-2"
        >
          Código do bolão
        </label>
        <input
          ref={codeRef}
          id="code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          defaultValue={presetCode}
          className="w-full bg-graphite border border-rule px-4 py-4 text-bone font-mono text-lg tracking-[0.18em] uppercase focus:border-acid focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="nickname"
          className="block text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-2"
        >
          Seu apelido
        </label>
        <input
          id="nickname"
          name="nickname"
          required
          maxLength={24}
          placeholder="Como a galera te conhece"
          className="w-full bg-graphite border border-rule px-4 py-4 text-bone text-lg focus:border-acid focus:outline-none transition-colors placeholder:text-bone-faint"
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
        className="mt-2 bg-pitch border border-acid text-acid font-display text-xl font-extrabold uppercase tracking-wider py-4 hover:bg-acid hover:text-black transition-all disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar no bolão →"}
      </button>
    </form>
  );
}
