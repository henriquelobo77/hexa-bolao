"use client";

import { useActionState, useState } from "react";
import { savePrediction, type PredictResult } from "@/lib/actions/predictions";

async function action(_prev: PredictResult | null, formData: FormData) {
  return savePrediction(formData);
}

interface Props {
  matchId: string;
  initialHome?: number | null;
  initialAway?: number | null;
  initialAdvances?: string | null;
  disabled?: boolean;
  compact?: boolean;
  // Para mata-mata: códigos dos dois times pra mostrar nos botões de "quem passa"
  isKnockout?: boolean;
  homeCode?: string;
  awayCode?: string;
}

export function PredictionInput({
  matchId,
  initialHome = null,
  initialAway = null,
  initialAdvances = null,
  disabled = false,
  compact = false,
  isKnockout = false,
  homeCode,
  awayCode,
}: Props) {
  const [state, formAction, pending] = useActionState<PredictResult | null, FormData>(
    action,
    null
  );
  const [home, setHome] = useState<string>(initialHome != null ? String(initialHome) : "");
  const [away, setAway] = useState<string>(initialAway != null ? String(initialAway) : "");
  const [advances, setAdvances] = useState<string>(initialAdvances ?? "");

  // É empate? só mostra quem passa se mata-mata + empate
  const isDraw =
    home !== "" && away !== "" && parseInt(home, 10) === parseInt(away, 10);
  const needsAdvancePicker = Boolean(isKnockout && isDraw && homeCode && awayCode);

  return (
    <form
      action={formAction}
      className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}
    >
      <input type="hidden" name="match_id" value={matchId} />
      {needsAdvancePicker && (
        <input type="hidden" name="advances_team_code" value={advances} />
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          name="home_score"
          inputMode="numeric"
          min={0}
          max={20}
          required
          disabled={disabled}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-14 h-14 bg-pitch-deep border border-rule text-center font-mono font-bold text-2xl text-bone focus:border-acid focus:outline-none disabled:opacity-40 tabular-nums"
        />
        <span className="font-mono text-bone-muted">×</span>
        <input
          type="number"
          name="away_score"
          inputMode="numeric"
          min={0}
          max={20}
          required
          disabled={disabled}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-14 h-14 bg-pitch-deep border border-rule text-center font-mono font-bold text-2xl text-bone focus:border-acid focus:outline-none disabled:opacity-40 tabular-nums"
        />
        {compact && !needsAdvancePicker && (
          <button
            type="submit"
            disabled={disabled || pending}
            className="ml-2 bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 py-3 hover:bg-acid hover:text-black transition disabled:opacity-40"
          >
            {pending ? "..." : "OK"}
          </button>
        )}
      </div>

      {needsAdvancePicker && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
            ↳ Quem passa nos pênaltis/prorrogação?
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdvances(homeCode!)}
              disabled={disabled}
              className={`font-display font-extrabold uppercase tracking-wider py-3 border transition disabled:opacity-40 ${
                advances === homeCode
                  ? "bg-acid text-black border-acid"
                  : "bg-pitch border-rule text-bone hover:border-acid hover:text-acid"
              }`}
            >
              {homeCode}
            </button>
            <button
              type="button"
              onClick={() => setAdvances(awayCode!)}
              disabled={disabled}
              className={`font-display font-extrabold uppercase tracking-wider py-3 border transition disabled:opacity-40 ${
                advances === awayCode
                  ? "bg-acid text-black border-acid"
                  : "bg-pitch border-rule text-bone hover:border-acid hover:text-acid"
              }`}
            >
              {awayCode}
            </button>
          </div>
        </div>
      )}

      {(!compact || needsAdvancePicker) && (
        <button
          type="submit"
          disabled={disabled || pending || (needsAdvancePicker && !advances)}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider py-3 hover:bg-acid hover:text-black transition disabled:opacity-40"
        >
          {pending ? "Salvando..." : "Travar palpite"}
        </button>
      )}
      {state && !state.ok && (
        <div className="text-warning text-xs font-mono uppercase tracking-wide">
          ↳ {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="text-acid text-xs font-mono uppercase tracking-wide">
          ↳ Salvo.
        </div>
      )}
    </form>
  );
}
