"use client";

import { useActionState } from "react";
import { adminUpdateScoring } from "@/lib/actions/admin";
import type { ScoringConfig } from "@/lib/types";

type R = { ok: true } | { ok: false; error: string };
async function action(_prev: R | null, formData: FormData) {
  return adminUpdateScoring(formData) as Promise<R>;
}

interface Props {
  config: ScoringConfig;
}

function Field({
  label, name, value, type = "number", step = "1", note,
}: {
  label: string;
  name: string;
  value: number | string | boolean;
  type?: string;
  step?: string;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_120px] gap-3 items-center py-2 border-b border-rule">
      <div>
        <label htmlFor={name} className="font-display text-sm font-bold uppercase tracking-wide">
          {label}
        </label>
        {note && (
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-muted">
            {note}
          </div>
        )}
      </div>
      {type === "checkbox" ? (
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={Boolean(value)}
          className="w-5 h-5 bg-pitch-deep border border-rule accent-[#D7FF1E] justify-self-end"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          step={step}
          defaultValue={value as number | string}
          className="bg-pitch-deep border border-rule px-3 py-2 text-bone font-mono text-base tabular-nums focus:border-acid focus:outline-none"
        />
      )}
    </div>
  );
}

export function AdminScoringForm({ config }: Props) {
  const [state, formAction, pending] = useActionState<R | null, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="bolao_id" value={config.bolao_id} />

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          § Por jogo
        </div>
        <Field label="Placar exato" name="pts_placar_exato" value={config.pts_placar_exato} />
        <Field label="Empate com placar exato" name="pts_empate_exato" value={config.pts_empate_exato} />
        <Field label="Acertou vencedor" name="pts_vencedor" value={config.pts_vencedor} />
        <Field label="Saldo de gols (adicional)" name="pts_saldo" value={config.pts_saldo} />
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          § Multiplicadores
        </div>
        <Field label="Jogos do Brasil" name="mult_brasil" value={config.mult_brasil} step="0.1" />
        <Field label="Oitavas" name="mult_oitavas" value={config.mult_oitavas} step="0.1" />
        <Field label="Quartas" name="mult_quartas" value={config.mult_quartas} step="0.1" />
        <Field label="Semifinal" name="mult_semi" value={config.mult_semi} step="0.1" />
        <Field label="Final" name="mult_final" value={config.mult_final} step="0.1" />
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          § Bônus zebra
        </div>
        <Field label="Habilitado" name="bonus_zebra_enabled" value={config.bonus_zebra_enabled} type="checkbox" />
        <Field label="Máx. pessoas que cravaram" name="bonus_zebra_max_hits" value={config.bonus_zebra_max_hits} note="Padrão 1 = só quem cravou sozinho ganha o bônus" />
        <Field label="Pontos extras" name="bonus_zebra_pts" value={config.bonus_zebra_pts} />
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          § Palpites únicos
        </div>
        <Field label="Pts campeão" name="pts_campeao" value={config.pts_campeao} />
        <Field label="Pts artilheiro" name="pts_artilheiro" value={config.pts_artilheiro} />
        <Field label="Habilitar vice" name="enable_vice" value={config.enable_vice} type="checkbox" />
        <Field label="Pts vice" name="pts_vice" value={config.pts_vice} />
        <Field label="Habilitar semifinalistas" name="enable_semifinalistas" value={config.enable_semifinalistas} type="checkbox" />
        <Field label="Pts por semifinalista" name="pts_semifinalista" value={config.pts_semifinalista} />
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          § Deadline
        </div>
        <Field label="Minutos antes do apito (0 = no apito)" name="predict_deadline_min" value={config.predict_deadline_min} />
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-6 py-3 hover:bg-acid hover:text-black transition disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar regras"}
        </button>
        {state?.ok && (
          <span className="text-acid text-xs font-mono uppercase tracking-wide">
            ↳ Salvo.
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
