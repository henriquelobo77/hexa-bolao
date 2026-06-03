import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBolaoByCodeOrSlug,
  getMatchById,
  getScoringConfig,
  getMembers,
  getPredictionDistribution,
} from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { supabaseServer } from "@/lib/supabase";
import { scorePrediction, isPredictionOpen } from "@/lib/scoring";
import { FlagBar } from "@/components/flag-bar";
import { fmtDayMonthLong, fmtTime, fmtWeekday } from "@/lib/date";
import type { Prediction } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string; matchId: string }>;
}

const KIND_LABEL: Record<string, { label: string; color: string }> = {
  exato: { label: "Placar exato", color: "text-acid" },
  empate_exato: { label: "Empate cravado", color: "text-acid" },
  saldo: { label: "Vencedor + saldo", color: "text-bone" },
  vencedor: { label: "Só vencedor", color: "text-bone-muted" },
  errado: { label: "Errado", color: "text-warning" },
  pendente: { label: "Aguardando", color: "text-bone-faint" },
};

export default async function MatchDetailPage({ params }: Props) {
  const { code, matchId } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const [match, cfg, members, distribution] = await Promise.all([
    getMatchById(matchId),
    getScoringConfig(bolao.id),
    getMembers(bolao.id),
    getPredictionDistribution(bolao.id),
  ]);

  if (!match || match.bolao_id !== bolao.id || !cfg) notFound();

  // Busca todos os palpites desse jogo
  const supabase = await supabaseServer();
  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("match_id", matchId)
    .returns<Prediction[]>();
  const allPreds = predictions ?? [];

  const open = isPredictionOpen(match, cfg);
  const memberById = new Map(members.map((m) => [m.id, m]));

  const isBrazil =
    match.team_home_code === "BRA" || match.team_away_code === "BRA";
  const finished = match.status === "finished";

  // Linhas de cada palpiteiro (só calcula se travou)
  const rows = open
    ? []
    : allPreds
        .map((p) => {
          const m = memberById.get(p.member_id);
          if (!m) return null;
          const scored = scorePrediction(p, match, cfg, distribution);
          return {
            nickname: m.nickname,
            home: p.home_score,
            away: p.away_score,
            isMe: p.member_id === member.id,
            pts: scored.total_points,
            kind: scored.kind as string,
            zebra: scored.zebra_bonus > 0,
            mult: scored.multiplier,
          };
        })
        .filter(<T,>(x: T | null): x is T => x !== null)
        .sort((a, b) => b.pts - a.pts || a.nickname.localeCompare(b.nickname));

  // Quem não palpitou
  const palpitouIds = new Set(allPreds.map((p) => p.member_id));
  const semPalpite = members.filter((m) => !palpitouIds.has(m.id));

  return (
    <div className="hexa-container py-6 space-y-6">
      <div>
        <Link
          href={`/b/${code}/jogos`}
          className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted hover:text-acid"
        >
          ← Todos os jogos
        </Link>
      </div>

      {/* Match header */}
      <header className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted flex items-center gap-2">
          <span>{match.round_label ?? match.phase}</span>
          {isBrazil && <span className="text-acid font-bold">· Brasil 2×</span>}
        </div>

        <div className="flex gap-2 -mx-0.5">
          <FlagBar code={match.team_home_code} className="flex-1 w-full" height={4} />
          <FlagBar code={match.team_away_code} className="flex-1 w-full" height={4} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center md:text-left">
            <div className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-none">
              {match.team_home_code}
            </div>
            <div className="text-[11px] text-bone-muted mt-1">
              {match.team_home_name}
            </div>
          </div>
          <div className="text-center">
            {finished ? (
              <div className="font-mono font-bold text-3xl tabular-nums">
                {match.official_home_score}–{match.official_away_score}
              </div>
            ) : (
              <div className="font-mono text-bone-muted text-2xl">×</div>
            )}
          </div>
          <div className="text-center md:text-right">
            <div className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-none">
              {match.team_away_code}
            </div>
            <div className="text-[11px] text-bone-muted mt-1">
              {match.team_away_name}
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
          {fmtWeekday(match.kickoff_at)} · {fmtDayMonthLong(match.kickoff_at)} · {fmtTime(match.kickoff_at)}
          {match.venue && ` · ${match.venue}`}
        </div>
      </header>

      {/* Status */}
      {open ? (
        <section className="border border-rule p-6 text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-2">
            ↳ Palpites secretos
          </div>
          <div className="font-display text-2xl font-bold uppercase tracking-tight mb-2">
            Os palpites são revelados quando o jogo travar
          </div>
          <div className="text-bone-muted text-sm">
            Até o apito inicial, cada um palpita no escuro. Vai apertar o ranking só depois.
          </div>
          <div className="mt-6">
            <Link
              href={`/b/${code}/jogos`}
              className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-3 inline-block hover:bg-acid hover:text-black transition"
            >
              Ir palpitar →
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Lista de palpites */}
          <section>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2 flex items-center justify-between">
              <span>Palpites · {rows.length}</span>
              {finished && <span className="text-acid">Resultado lançado</span>}
            </div>
            {rows.length === 0 ? (
              <div className="text-center text-bone-muted py-8">
                Ninguém palpitou nesse jogo.
              </div>
            ) : (
              <div>
                {rows.map((r, i) => {
                  const k = KIND_LABEL[r.kind] ?? KIND_LABEL.pendente;
                  return (
                    <div
                      key={`${r.nickname}-${i}`}
                      className={`grid grid-cols-[30px_1fr_auto_70px] gap-3 items-baseline py-3 border-b border-rule ${
                        r.isMe ? "bg-graphite/40 px-3 -mx-3" : ""
                      }`}
                    >
                      <span className="font-mono text-[10px] text-bone-muted tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-lg font-bold uppercase tracking-tight truncate">
                        {r.nickname}
                        {r.isMe && (
                          <span className="text-acid text-[9px] font-mono ml-2 tracking-[0.16em]">
                            (você)
                          </span>
                        )}
                      </span>
                      <div className="text-right">
                        <div className="font-mono font-bold tabular-nums text-base">
                          {r.home}–{r.away}
                        </div>
                        <div className={`text-[9px] font-mono uppercase tracking-[0.14em] ${k.color}`}>
                          {k.label}
                          {r.zebra && <span className="text-acid"> · zebra</span>}
                          {r.mult > 1 && <span className="text-acid"> · ×{r.mult}</span>}
                        </div>
                      </div>
                      <div className={`text-right font-mono font-bold tabular-nums text-base ${
                        r.pts > 0 ? "text-acid" : "text-bone-muted"
                      }`}>
                        {r.pts > 0 ? "+" : ""}
                        {r.pts}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quem não palpitou */}
          {semPalpite.length > 0 && (
            <section>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
                Sem palpite · {semPalpite.length}
              </div>
              <div className="flex flex-wrap gap-2">
                {semPalpite.map((m) => (
                  <span
                    key={m.id}
                    className="text-[11px] font-mono uppercase tracking-[0.16em] text-bone-faint border border-rule px-2 py-1"
                  >
                    {m.nickname}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
