import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBolaoByCodeOrSlug,
  getMatches,
  getNextMatch,
  getRanking,
  getScoringConfig,
  getPredictionsForMember,
} from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { FlagBar } from "@/components/flag-bar";
import { CountdownClock } from "@/components/countdown-clock";
import { PredictionInput } from "@/components/prediction-input";
import { MatchCard } from "@/components/match-card";
import { fmtDayMonth, fmtTime } from "@/lib/date";
import { isPredictionOpen } from "@/lib/scoring";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function BolaoHomePage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const [nextMatch, matches, ranking, cfg, predictions] = await Promise.all([
    getNextMatch(bolao.id),
    getMatches(bolao.id),
    getRanking(bolao.id),
    getScoringConfig(bolao.id),
    getPredictionsForMember(member.id),
  ]);

  const predById = new Map(predictions.map((p) => [p.match_id, p]));
  const myPred = nextMatch ? predById.get(nextMatch.id) : undefined;
  const open = nextMatch && cfg ? isPredictionOpen(nextMatch, cfg) : false;
  const isBrazilNext =
    nextMatch &&
    (nextMatch.team_home_code === "BRA" || nextMatch.team_away_code === "BRA");

  const upcoming = matches
    .filter((m) => new Date(m.kickoff_at).getTime() > Date.now())
    .slice(0, 5);

  const me = ranking.find((r) => r.member_id === member.id);
  const top = ranking.slice(0, 4);

  return (
    <div className="hexa-container py-6 space-y-8">
      {/* HERO — próximo jogo */}
      {nextMatch ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
            <span>↳ Próximo jogo</span>
            {isBrazilNext && (
              <span className="text-acid font-bold">Brasil 2×</span>
            )}
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
              {nextMatch.team_home_code}
            </span>
            <span className="text-acid font-display text-3xl font-bold mx-0.5">×</span>
            <span className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
              {nextMatch.team_away_code}
            </span>
          </div>

          <div className="flex gap-2 -mx-0.5">
            <FlagBar code={nextMatch.team_home_code} className="flex-1 w-full" height={4} />
            <FlagBar code={nextMatch.team_away_code} className="flex-1 w-full" height={4} />
          </div>

          <CountdownClock target={nextMatch.kickoff_at} />

          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
            {fmtDayMonth(nextMatch.kickoff_at)} · {fmtTime(nextMatch.kickoff_at)} ·{" "}
            {nextMatch.venue}
          </div>

          {open ? (
            <div className="pt-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-2">
                Seu palpite
              </div>
              <PredictionInput
                matchId={nextMatch.id}
                initialHome={myPred?.home_score ?? null}
                initialAway={myPred?.away_score ?? null}
              />
            </div>
          ) : (
            <div className="pt-3 text-bone-muted text-sm font-mono uppercase tracking-wide">
              ↳ Palpites encerrados.
            </div>
          )}
        </section>
      ) : (
        <section className="text-bone-muted py-12 text-center">
          Sem jogos agendados.
        </section>
      )}

      {/* PRÓXIMOS — lista curta */}
      <section>
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2">
          <span>Próximos · {upcoming.length}</span>
          <Link href={`/b/${code}/jogos`} className="hover:text-bone">
            Ver tudo →
          </Link>
        </div>
        <div>
          {upcoming.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predById.get(m.id) ?? null}
              href={`/b/${code}/jogos#${m.id}`}
            />
          ))}
        </div>
      </section>

      {/* RANKING — top 4 + você */}
      <section className="bg-graphite border border-rule p-4 rounded-sm">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          <span>Ranking · Top 4</span>
          <Link href={`/b/${code}/ranking`} className="hover:text-bone">
            {ranking.length} membros →
          </Link>
        </div>
        {top.length === 0 && (
          <div className="text-bone-muted text-sm py-3">Ranking ainda vazio.</div>
        )}
        {top.map((r) => {
          const isMe = r.member_id === member.id;
          return (
            <div
              key={r.member_id}
              className={`grid grid-cols-[28px_1fr_auto] items-baseline gap-3 py-2 ${
                isMe ? "text-acid" : ""
              }`}
            >
              <span className="font-mono font-bold tabular-nums">
                {String(r.rank).padStart(2, "0")}
              </span>
              <span className="font-display font-bold uppercase tracking-wide truncate">
                {r.nickname}
              </span>
              <span className="font-mono font-bold tabular-nums">
                {String(r.total_points).padStart(3, "0")}
              </span>
            </div>
          );
        })}
        {me && me.rank > 4 && (
          <>
            <div className="text-bone-faint text-center font-mono text-[10px] py-1">···</div>
            <div className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3 py-2 text-acid">
              <span className="font-mono font-bold tabular-nums">
                {String(me.rank).padStart(2, "0")}
              </span>
              <span className="font-display font-bold uppercase tracking-wide truncate">
                {me.nickname} (você)
              </span>
              <span className="font-mono font-bold tabular-nums">
                {String(me.total_points).padStart(3, "0")}
              </span>
            </div>
          </>
        )}
      </section>

      {/* ATALHOS — regras + convidar + stats */}
      <section className="grid grid-cols-3 gap-2">
        <Link
          href={`/b/${code}/regras`}
          className="border border-rule p-3 hover:border-acid hover:bg-graphite/40 transition flex flex-col items-start gap-1"
        >
          <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
            §
          </span>
          <span className="font-display text-base font-bold uppercase tracking-tight leading-none">
            Regras
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-bone-faint leading-tight mt-1">
            Como pontua
          </span>
        </Link>
        <Link
          href={`/b/${code}/convidar`}
          className="border border-rule p-3 hover:border-acid hover:bg-graphite/40 transition flex flex-col items-start gap-1"
        >
          <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
            +
          </span>
          <span className="font-display text-base font-bold uppercase tracking-tight leading-none">
            Convidar
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-bone-faint leading-tight mt-1">
            QR · link · zap
          </span>
        </Link>
        <Link
          href={`/b/${code}/stats`}
          className="border border-rule p-3 hover:border-acid hover:bg-graphite/40 transition flex flex-col items-start gap-1"
        >
          <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
            ▤
          </span>
          <span className="font-display text-base font-bold uppercase tracking-tight leading-none">
            Stats
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-bone-faint leading-tight mt-1">
            Seus números
          </span>
        </Link>
      </section>
    </div>
  );
}
