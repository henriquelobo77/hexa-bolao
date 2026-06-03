import { notFound } from "next/navigation";
import {
  getBolaoByCodeOrSlug,
  getMatches,
  getPredictionsForMember,
  getScoringConfig,
  getPredictionDistribution,
} from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { scorePrediction } from "@/lib/scoring";
import { FlagBar } from "@/components/flag-bar";
import { fmtDayMonth, fmtTime } from "@/lib/date";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function PalpitesPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const [matches, predictions, cfg, distribution] = await Promise.all([
    getMatches(bolao.id),
    getPredictionsForMember(member.id),
    getScoringConfig(bolao.id),
    getPredictionDistribution(bolao.id),
  ]);

  if (!cfg) return null;

  const matchById = new Map(matches.map((m) => [m.id, m]));

  // Para cada palpite, calcula a pontuação
  const rows = predictions
    .map((p) => {
      const match = matchById.get(p.match_id);
      if (!match) return null;
      const scored = scorePrediction(p, match, cfg, distribution);
      return { prediction: p, match, scored };
    })
    .filter(<T,>(x: T | null): x is T => x !== null)
    .sort((a, b) => b.match.kickoff_at.localeCompare(a.match.kickoff_at));

  const finalized = rows.filter((r) => r.scored.kind !== "pendente");
  const pending = rows.filter((r) => r.scored.kind === "pendente");
  const totalPts = finalized.reduce((acc, r) => acc + r.scored.total_points, 0);
  const acertos = finalized.filter((r) => r.scored.kind !== "errado").length;
  const cravadas = finalized.filter(
    (r) => r.scored.kind === "exato" || r.scored.kind === "empate_exato"
  ).length;

  return (
    <div className="hexa-container py-6 space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Seu histórico
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Palpites
        </h1>
      </header>

      <section className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: predictions.length },
          { label: "Cravadas", value: cravadas },
          { label: "Acertos", value: acertos },
          { label: "Pontos", value: totalPts },
        ].map((s) => (
          <div key={s.label} className="border border-rule p-3">
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
              {s.label}
            </div>
            <div className="font-mono font-bold text-2xl tabular-nums mt-1">{s.value}</div>
          </div>
        ))}
      </section>

      {pending.length > 0 && (
        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
            Aguardando resultado · {pending.length}
          </div>
          {pending.map(({ prediction: p, match: m }) => (
            <PalpiteRow
              key={p.id}
              date={`${fmtDayMonth(m.kickoff_at)} · ${fmtTime(m.kickoff_at)}`}
              homeCode={m.team_home_code}
              awayCode={m.team_away_code}
              guess={`${p.home_score}–${p.away_score}`}
              result={null}
              pts={null}
              kind="pendente"
            />
          ))}
        </section>
      )}

      {finalized.length > 0 && (
        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
            Finalizados · {finalized.length}
          </div>
          {finalized.map(({ prediction: p, match: m, scored }) => (
            <PalpiteRow
              key={p.id}
              date={`${fmtDayMonth(m.kickoff_at)} · ${fmtTime(m.kickoff_at)}`}
              homeCode={m.team_home_code}
              awayCode={m.team_away_code}
              guess={`${p.home_score}–${p.away_score}`}
              result={`${m.official_home_score}–${m.official_away_score}`}
              pts={scored.total_points}
              kind={scored.kind}
              zebra={scored.zebra_bonus > 0}
              mult={scored.multiplier}
            />
          ))}
        </section>
      )}

      {rows.length === 0 && (
        <div className="text-bone-muted text-center py-12">
          Você ainda não palpitou em nenhum jogo.
        </div>
      )}
    </div>
  );
}

interface RowProps {
  date: string;
  homeCode: string;
  awayCode: string;
  guess: string;
  result: string | null;
  pts: number | null;
  kind: string;
  zebra?: boolean;
  mult?: number;
}

function PalpiteRow({
  date, homeCode, awayCode, guess, result, pts, kind, zebra, mult,
}: RowProps) {
  const color =
    kind === "exato" || kind === "empate_exato"
      ? "text-acid"
      : kind === "saldo" || kind === "vencedor"
      ? "text-bone"
      : kind === "errado"
      ? "text-bone-muted"
      : "text-bone-faint";

  return (
    <article className="grid grid-cols-[1fr_auto] gap-3 py-3 border-b border-rule items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-base">
          <FlagBar code={homeCode} className="w-5 flex-shrink-0" height={3} />
          <span className="font-display font-bold tracking-tight uppercase">{homeCode}</span>
          <span className="text-bone-muted font-mono text-[11px]">×</span>
          <span className="font-display font-bold tracking-tight uppercase">{awayCode}</span>
          <FlagBar code={awayCode} className="w-5 flex-shrink-0" height={3} />
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted mt-0.5">
          {date}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-baseline gap-3 justify-end">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-muted">
            seu <span className="text-bone font-bold tabular-nums">{guess}</span>
          </div>
          {result && (
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-muted">
              oficial <span className={`font-bold tabular-nums ${color}`}>{result}</span>
            </div>
          )}
        </div>
        {pts !== null && (
          <div className={`font-mono font-bold tabular-nums text-base ${color}`}>
            {pts > 0 ? "+" : ""}
            {pts} pts
            {mult && mult > 1 && (
              <span className="text-acid text-[9px] ml-1">×{mult}</span>
            )}
            {zebra && <span className="text-acid text-[9px] ml-1">ZEBRA</span>}
          </div>
        )}
      </div>
    </article>
  );
}
