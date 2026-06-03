"use client";

import { useActionState, useState } from "react";
import { updateNickname, type UpdateNickResult } from "@/lib/actions/member";

async function action(_prev: UpdateNickResult | null, formData: FormData) {
  return updateNickname(formData);
}

export function PerfilForm({ initialNick }: { initialNick: string }) {
  const [state, formAction, pending] = useActionState<UpdateNickResult | null, FormData>(
    action,
    null
  );
  const [nick, setNick] = useState(initialNick);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
        Apelido
      </label>
      <input
        name="nickname"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        required
        maxLength={24}
        className="bg-pitch-deep border border-rule px-4 py-3 text-bone text-lg focus:border-acid focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || nick === initialNick || !nick.trim()}
        className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-3 hover:bg-acid hover:text-black transition disabled:opacity-40 self-start"
      >
        {pending ? "Salvando..." : "Salvar →"}
      </button>
      {state?.ok && (
        <div className="text-acid text-xs font-mono uppercase tracking-wide">↳ Salvo.</div>
      )}
      {state && !state.ok && (
        <div className="text-warning text-xs font-mono uppercase tracking-wide">
          ↳ {state.error}
        </div>
      )}
    </form>
  );
}
