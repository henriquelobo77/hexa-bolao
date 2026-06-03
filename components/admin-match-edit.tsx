"use client";

import { useActionState, useState } from "react";
import { adminUpdateMatch, adminDeleteMatch } from "@/lib/actions/admin";
import type { Match } from "@/lib/types";

type R = { ok: true } | { ok: false; error: string };

async function updateAction(_prev: R | null, formData: FormData) {
  return adminUpdateMatch(formData) as Promise<R>;
}
async function deleteAction(_prev: R | null, formData: FormData) {
  return adminDeleteMatch(formData) as Promise<R>;
}

interface Props {
  match: Match;
}

function toLocalInput(iso: string): string {
  // Converte ISO UTC pra formato datetime-local em BR (UTC-3)
  const d = new Date(iso);
  const offset = -180; // -3h em minutos
  const local = new Date(d.getTime() + offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(local: string): string {
  // O input datetime-local não tem timezone — assume BR (UTC-3)
  return new Date(local + ":00-03:00").toISOString();
}

export function AdminMatchEdit({ match }: Props) {
  const [open, setOpen] = useState(false);
  const [updateState, updateForm, updating] = useActionState<R | null, FormData>(
    updateAction,
    null
  );
  const [, deleteForm, deleting] = useActionState<R | null, FormData>(deleteAction, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-acid"
      >
        Editar →
      </button>
    );
  }

  return (
    <div className="col-span-3 mt-3 p-3 border border-rule bg-graphite/40 rounded-sm">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-muted">
          Editar jogo
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-bone"
        >
          fechar ×
        </button>
      </div>
      <form
        action={(fd) => {
          const kickoff = fd.get("kickoff_local") as string;
          if (kickoff) fd.set("kickoff_at", fromLocalInput(kickoff));
          updateForm(fd);
        }}
        className="grid grid-cols-2 gap-2"
      >
        <input type="hidden" name="match_id" value={match.id} />

        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Cód. casa
          <input name="team_home_code" defaultValue={match.team_home_code} maxLength={8} required
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone font-mono text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Nome casa
          <input name="team_home_name" defaultValue={match.team_home_name} maxLength={64} required
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Cód. visit.
          <input name="team_away_code" defaultValue={match.team_away_code} maxLength={8} required
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone font-mono text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Nome visit.
          <input name="team_away_name" defaultValue={match.team_away_name} maxLength={64} required
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Data/hora (BR)
          <input
            name="kickoff_local"
            type="datetime-local"
            defaultValue={toLocalInput(match.kickoff_at)}
            required
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone font-mono text-sm focus:border-acid focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
          Sede
          <input name="venue" defaultValue={match.venue ?? ""} maxLength={64}
            className="bg-pitch-deep border border-rule px-2 py-1.5 text-bone text-sm focus:border-acid focus:outline-none" />
        </label>
        <div className="col-span-2 flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={updating}
              className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-3 py-1.5 text-sm hover:bg-acid hover:text-black transition disabled:opacity-40"
            >
              {updating ? "..." : "Salvar"}
            </button>
            {updateState?.ok && (
              <span className="text-acid text-[10px] font-mono uppercase">✓ salvo</span>
            )}
            {updateState && !updateState.ok && (
              <span className="text-warning text-[10px] font-mono uppercase">{updateState.error}</span>
            )}
          </div>
        </div>
      </form>
      <form
        action={deleteForm}
        onSubmit={(e) => {
          if (!confirm("Remover esse jogo? Os palpites nele também serão removidos.")) e.preventDefault();
        }}
        className="mt-3 pt-3 border-t border-rule flex justify-end"
      >
        <input type="hidden" name="match_id" value={match.id} />
        <button
          type="submit"
          disabled={deleting}
          className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-warning border border-rule px-3 py-1.5"
        >
          {deleting ? "..." : "Deletar jogo"}
        </button>
      </form>
    </div>
  );
}
