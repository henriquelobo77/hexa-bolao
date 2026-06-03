"use client";

import { useActionState, useState } from "react";
import { adminAddMatch } from "@/lib/actions/admin";

type R = { ok: true } | { ok: false; error: string };
async function action(_prev: R | null, formData: FormData) {
  return adminAddMatch(formData) as Promise<R>;
}

function fromLocalInput(local: string): string {
  return new Date(local + ":00-03:00").toISOString();
}

interface Props {
  bolaoId: string;
}

export function AdminMatchAdd({ bolaoId }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<R | null, FormData>(action, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 py-2 hover:bg-acid hover:text-black transition"
      >
        + Adicionar jogo
      </button>
    );
  }

  return (
    <div className="border border-rule bg-graphite/40 p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="font-display text-lg font-bold uppercase tracking-tight">
          Adicionar jogo manualmente
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-bone"
        >
          fechar ×
        </button>
      </div>
      <form
        action={(fd) => {
          const kickoff = fd.get("kickoff_local") as string;
          if (kickoff) fd.set("kickoff_at", fromLocalInput(kickoff));
          formAction(fd);
        }}
        className="grid grid-cols-2 md:grid-cols-3 gap-2"
      >
        <input type="hidden" name="bolao_id" value={bolaoId} />

        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Fase
          <select name="phase" required
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none">
            <option value="grupos">Grupos</option>
            <option value="r32">Round of 32</option>
            <option value="oitavas">Oitavas</option>
            <option value="quartas">Quartas</option>
            <option value="semi">Semifinal</option>
            <option value="terceiro">3º lugar</option>
            <option value="final">Final</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Grupo (A-L)
          <input name="group_letter" maxLength={2} placeholder="ex: G"
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone font-mono text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted col-span-2 md:col-span-1">
          Rótulo da rodada
          <input name="round_label" maxLength={64} placeholder="ex: Grupo G · Rodada 1"
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none" />
        </label>

        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Cód. casa
          <input name="team_home_code" maxLength={8} required placeholder="BRA"
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone font-mono text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted col-span-2">
          Nome casa
          <input name="team_home_name" maxLength={64} required placeholder="Brasil"
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none" />
        </label>

        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Cód. visit.
          <input name="team_away_code" maxLength={8} required placeholder="CRO"
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone font-mono text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted col-span-2">
          Nome visit.
          <input name="team_away_name" maxLength={64} required placeholder="Croácia"
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none" />
        </label>

        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted col-span-2">
          Data/hora (BR)
          <input name="kickoff_local" type="datetime-local" required
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone font-mono text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Sede
          <input name="venue" maxLength={64} placeholder="Estádio · Cidade"
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none" />
        </label>

        <div className="col-span-2 md:col-span-3 flex items-center gap-3 mt-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-2 hover:bg-acid hover:text-black transition disabled:opacity-40"
          >
            {pending ? "Salvando..." : "Criar jogo →"}
          </button>
          {state?.ok && (
            <span className="text-acid text-[11px] font-mono uppercase tracking-wide">✓ criado</span>
          )}
          {state && !state.ok && (
            <span className="text-warning text-[11px] font-mono uppercase tracking-wide">{state.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}
