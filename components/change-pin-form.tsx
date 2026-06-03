"use client";

import { useActionState, useState } from "react";
import { changePin, type ChangePinResult } from "@/lib/actions/member";

async function action(_prev: ChangePinResult | null, formData: FormData) {
  return changePin(formData);
}

export function ChangePinForm() {
  const [state, formAction, pending] = useActionState<ChangePinResult | null, FormData>(
    action,
    null
  );
  const [cur, setCur] = useState("");
  const [nu, setNu] = useState("");

  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-2">
          PIN atual
        </label>
        <input
          name="current_pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          minLength={4}
          maxLength={6}
          required
          autoComplete="off"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
          className="w-full bg-pitch-deep border border-rule px-4 py-3 text-bone font-mono text-lg tracking-[0.5em] focus:border-acid focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-2">
          Novo PIN
        </label>
        <input
          name="new_pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          minLength={4}
          maxLength={6}
          required
          autoComplete="off"
          value={nu}
          onChange={(e) => setNu(e.target.value)}
          className="w-full bg-pitch-deep border border-rule px-4 py-3 text-bone font-mono text-lg tracking-[0.5em] focus:border-acid focus:outline-none"
        />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !cur || !nu}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-3 hover:bg-acid hover:text-black transition disabled:opacity-40"
        >
          {pending ? "Salvando..." : "Salvar novo PIN →"}
        </button>
        {state?.ok && (
          <span className="text-acid text-xs font-mono uppercase tracking-wide">
            ↳ Trocado. Use o novo PIN na próxima entrada.
          </span>
        )}
        {state && !state.ok && (
          <span className="text-warning text-xs font-mono uppercase tracking-wide">
            ↳ {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
