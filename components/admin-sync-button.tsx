"use client";

import { useActionState, useState } from "react";
import { adminSyncMatches, type SyncResult } from "@/lib/actions/sync";

async function action(_prev: SyncResult | null, formData: FormData) {
  return adminSyncMatches(formData);
}

export function AdminSyncButton() {
  const [state, formAction, pending] = useActionState<SyncResult | null, FormData>(
    action,
    null
  );
  const [reset, setReset] = useState(false);

  return (
    <div className="border border-rule p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
            ↳ football-data.org
          </div>
          <div className="font-display text-lg font-bold uppercase tracking-tight">
            Sincronizar com FIFA
          </div>
          <div className="text-[11px] text-bone-muted mt-1">
            Puxa as 104 partidas + resultados ao vivo da Copa.
          </div>
        </div>
        <form action={formAction} className="flex flex-col gap-2 items-end">
          {reset && <input type="hidden" name="wipe" value="1" />}
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted">
            <input
              type="checkbox"
              checked={reset}
              onChange={(e) => setReset(e.target.checked)}
              className="w-4 h-4 accent-[#D7FF1E]"
            />
            Reset
          </label>
          <button
            type="submit"
            disabled={pending}
            onClick={(e) => {
              if (reset && !confirm("Reset apaga TODOS os jogos do bolão (e palpites). Continuar?")) {
                e.preventDefault();
              }
            }}
            className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-2.5 hover:bg-acid hover:text-black transition disabled:opacity-40"
          >
            {pending ? "Sincronizando..." : "Sync agora →"}
          </button>
        </form>
      </div>
      {state?.ok && (
        <div className="text-acid text-xs font-mono uppercase tracking-wide">
          ↳ {state.processed} partidas processadas · {state.finished} finalizadas · {state.live} ao vivo
        </div>
      )}
      {state && !state.ok && (
        <div className="text-warning text-xs font-mono uppercase tracking-wide">
          ↳ {state.error}
        </div>
      )}
    </div>
  );
}
