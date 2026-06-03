import { notFound } from "next/navigation";
import {
  getBolaoByCodeOrSlug,
  getMatches,
  getPredictionsForBolao,
  getScoringConfig,
  getPredictionDistribution,
  getMembers,
} from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { scorePrediction } from "@/lib/scoring";
import type { Match, Prediction, ScoringConfig, PredictionDistribution } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

interface PhaseStats {
  phase: string;
  label: string;
  myPts: number;
  myCount: number;
  avgPts: number;
}

function computeStatsForMember(
  memberId: string,
  matches: Match[],
  predictions: Prediction[],
  cfg: ScoringConfig,
  distribution: PredictionDistribution[]
) {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const myPreds = predictions.filter((p) => p.member_id === memberId);

  let total = 0;
  let exatos = 0;
  let vencedor = 0;
  let saldo = 0;
  let errados = 0;
  let pendentes = 0;
  let zebras = 0;
  let melhor: { match: Match; pts: number } | null = null;
  let pior: { match: Match; pts: number } | null = null;

  const byPhase = new Map<string, { pts: number; count: number }>();

  for (const p of myPreds) {
    const m = matchById.get(p.match_id);
    if (!m) continue;
    const scored = scorePrediction(p, m, cfg, distribution);
    if (scored.kind === "pendente") {
      pendentes++;
      continue;
    }
    total += scored.total_points;
    if (scored.zebra_bonus > 0) zebras++;
    switch (scored.kind) {
      case "exato":
      case "empate_exato":
        exatos++;
        break;
      case "saldo":
        saldo++;
        break;
      case "vencedor":
        vencedor++;
        break;
      case "errado":
        errados++;
        break;
    }
    if (!melhor || scored.total_points > melhor.pts) melhor = { match: m, pts: scored.total_points };
    if (!pior || scored.total_points < pior.pts) pior = { match: m, pts: scored.total_points };

    const cur = byPhase.get(m.phase) ?? { pts: 0, count: 0 };
    cur.pts += scored.total_points;
    cur.count++;
    byPhase.set(m.phase, cur);
  }

  return {
    total,
    finalizadas: exatos + vencedor + saldo + errados,
    exatos,
    vencedor,
    saldo,
    errados,
    pendentes,
    zebras,
    melhor,
    pior,
    byPhase,
  };
}

const PHASE_LABEL: Record<string, string> = {
  grupos: "Grupos",
  r32: "R32",
  oitavas: "Oitavas",
  quartas: "Quartas",
  semi: "Semi",
  terceiro: "3º",
  final: "Final",
};

export default async function StatsPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const [matches, predictions, cfg, distribution, members] = await Promise.all([
    getMatches(bolao.id),
    getPredictionsForBolao(bolao.id),
    getScoringConfig(bolao.id),
    getPredictionDistribution(bolao.id),
    getMembers(bolao.id),
  ]);
  if (!cfg) return null;

  const mine = computeStatsForMember(member.id, matches, predictions, cfg, distribution);
  const totalFinalized = mine.finalizadas;
  const acertos = mine.exatos + mine.vencedor + mine.saldo;
  const acertoPct = totalFinalized > 0 ? Math.round((acertos / totalFinalized) * 100) : 0;
  const cravadaPct = totalFinalized > 0 ? Math.round((mine.exatos / totalFinalized) * 100) : 0;

  // Comparação com a média
  const allStats = members.map((m) =>
    computeStatsForMember(m.id, matches, predictions, cfg, distribution)
  );
  const avgTotal =
    allStats.length > 0
      ? Math.round(allStats.reduce((acc, s) => acc + s.total, 0) / allStats.length)
      : 0;
  const maxTotal = Math.max(0, ...allStats.map((s) => s.total));

  // Pontos por fase (eu + média)
  const allPhases: string[] = ["grupos", "r32", "oitavas", "quartas", "semi", "terceiro", "final"];
  const phaseStats: PhaseStats[] = allPhases.map((phase) => {
    const my = mine.byPhase.get(phase) ?? { pts: 0, count: 0 };
    const totalPhase = allStats.reduce((acc, s) => acc + (s.byPhase.get(phase)?.pts ?? 0), 0);
    const avg = members.length > 0 ? Math.round(totalPhase / members.length) : 0;
    return {
      phase,
      label: PHASE_LABEL[phase] ?? phase,
      myPts: my.pts,
      myCount: my.count,
      avgPts: avg,
    };
  });
  const maxPhasePts = Math.max(1, ...phaseStats.flatMap((p) => [p.myPts, p.avgPts]));

  return (
    <div className="hexa-container py-6 space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Seus números neste bolão
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Stats
        </h1>
      </header>

      {/* Top cards */}
      <section className="grid grid-cols-4 gap-2">
        <Stat label="Pontos" value={mine.total} accent />
        <Stat label="% Acerto" value={`${acertoPct}%`} />
        <Stat label="% Cravadas" value={`${cravadaPct}%`} />
        <Stat label="Zebras" value={mine.zebras} />
      </section>

      {/* Vs. average */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Você vs. o bolão
        </div>
        <div className="space-y-3">
          <Bar label="Sua pontuação" value={mine.total} max={maxTotal || 1} accent />
          <Bar label={`Média (${members.length} pessoas)`} value={avgTotal} max={maxTotal || 1} />
          <Bar label="Líder" value={maxTotal} max={maxTotal || 1} faint />
        </div>
      </section>

      {/* Por fase */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Pontos por fase
        </div>
        <div className="space-y-2">
          {phaseStats.map((p) => (
            <div key={p.phase} className="grid grid-cols-[80px_1fr_auto] gap-3 items-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-muted">
                {p.label}
              </div>
              <div className="space-y-1">
                <Bar
                  label=""
                  value={p.myPts}
                  max={maxPhasePts}
                  accent
                  thin
                  rightLabel={`${p.myPts}`}
                />
                <Bar
                  label=""
                  value={p.avgPts}
                  max={maxPhasePts}
                  thin
                  rightLabel={`média ${p.avgPts}`}
                />
              </div>
              <div className="font-mono text-[10px] text-bone-muted tabular-nums">
                {p.myCount} jog
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Distribuição */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Distribuição dos seus palpites
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Stat label="Cravadas" value={mine.exatos} sub="placar exato" />
          <Stat label="Saldo" value={mine.saldo} sub="vencedor + saldo" />
          <Stat label="Vencedor" value={mine.vencedor} sub="só vencedor" />
          <Stat label="Errados" value={mine.errados} sub="errou tudo" />
          <Stat label="Pendentes" value={mine.pendentes} sub="aguarda jogo" />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-rule p-3">
      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
        {label}
      </div>
      <div className={`font-mono font-bold text-2xl tabular-nums mt-1 ${accent ? "text-acid" : ""}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[8px] font-mono uppercase tracking-[0.14em] text-bone-faint mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  accent,
  faint,
  thin,
  rightLabel,
}: {
  label: string;
  value: number;
  max: number;
  accent?: boolean;
  faint?: boolean;
  thin?: boolean;
  rightLabel?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = accent ? "bg-acid" : faint ? "bg-rule" : "bg-bone-muted";
  return (
    <div>
      {label && (
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted">
            {label}
          </span>
          <span className="font-mono font-bold tabular-nums text-base">
            {value}
          </span>
        </div>
      )}
      <div className={`relative bg-graphite ${thin ? "h-1.5" : "h-3"}`}>
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
        {rightLabel && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted">
            {rightLabel}
          </span>
        )}
      </div>
    </div>
  );
}
