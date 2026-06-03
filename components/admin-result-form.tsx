"use client";

import { useActionState, useState } from "react";
import { adminSetResult, adminClearResult } from "@/lib/actions/admin";
import type { MatchStatus } from "@/lib/types";

type R = { ok: true } | { ok: false; error: string };

async function setAction(_prev: R | null, formData: FormData) {
  return adminSetResult(formData) as Promise<R>;
}
async function clearAction(_prev: R | null, formData: FormData) {
  return adminClearResult(formData) as Promise<R>;
}

interface Props {
  matchId: string;
  initialHome: number | null;
  initialAway: number | null;
  status: MatchStatus;
}

export function AdminResultForm({ matchId, initialHome, initialAway, status }: Props) {
  const [state, formAction, pending] = useActionState<R | null, FormData>(setAction, null);
  const [, clearActionFn, clearing] = useActionState<R | null, FormData>(clearAction, null);
  const [home, setHome] = useState<string>(initialHome != null ? String(initialHome) : "");
  const [away, setAway] = useState<string>(initialAway != null ? String(initialAway) : "");

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction} className="flex items-center gap-1">
        <input type="hidden" name="match_id" value={matchId} />
        <input type="hidden" name="status" value="finished" />
        <input
          type="number"
          name="home_score"
          min={0}
          max={30}
          required
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-10 h-10 bg-pitch-deep border border-rule text-center font-mono font-bold text-base tabular-nums focus:border-acid focus:outline-none"
        />
        <span className="text-bone-muted text-xs">×</span>
        <input
          type="number"
          name="away_score"
          min={0}
          max={30}
          required
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-10 h-10 bg-pitch-deep border border-rule text-center font-mono font-bold text-base tabular-nums focus:border-acid focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-3 py-2 ml-1 hover:bg-acid hover:text-black transition disabled:opacity-40"
        >
          {pending ? "..." : status === "finished" ? "Atualizar" : "Lançar"}
        </button>
      </form>
      {status === "finished" && (
        <form action={clearActionFn}>
          <input type="hidden" name="match_id" value={matchId} />
          <button
            type="submit"
            disabled={clearing}
            className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-warning"
          >
            {clearing ? "..." : "Limpar"}
          </button>
        </form>
      )}
      {state && !state.ok && (
        <div className="text-warning text-[10px] font-mono uppercase">
          {state.error}
        </div>
      )}
    </div>
  );
}
