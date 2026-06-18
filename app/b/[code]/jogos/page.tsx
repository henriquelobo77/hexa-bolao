import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBolaoByCodeOrSlug,
  getMatches,
  getPredictionsForMember,
  getScoringConfig,
} from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { dayKeyBR, fmtDayMonthLong, fmtWeekday, fmtTime } from "@/lib/date";
import { FlagBar } from "@/components/flag-bar";
import { PredictionInput } from "@/components/prediction-input";
import { isPredictionOpen } from "@/lib/scoring";
import type { Match, Prediction, ScoringConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function JogosPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const [matches, predictions, cfg] = await Promise.all([
    getMatches(bolao.id),
    getPredictionsForMember(member.id),
    getScoringConfig(bolao.id),
  ]);

  const predById = new Map(predictions.map((p) => [p.match_id, p]));

  // Agrupa por dia
  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    const key = dayKeyBR(m.kickoff_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  const days = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Esconde dias anteriores a hoje num <details> colapsável — evita rolagem
  // gigante quando a Copa avança. "Hoje BR" como linha de corte.
  const todayKey = dayKeyBR(new Date().toISOString());
  const pastDays = days.filter(([day]) => day < todayKey);
  const upcomingDays = days.filter(([day]) => day >= todayKey);
  const totalPastMatches = pastDays.reduce((acc, [, items]) => acc + items.length, 0);

  return (
    <div className="hexa-container py-6 space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Calendário · 104 partidas
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Jogos
        </h1>
      </header>

      {pastDays.length > 0 && (
        <details className="border border-rule group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-4 py-3 hover:bg-graphite/40 flex items-center justify-between gap-3 select-none">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
                ↳ Jogos anteriores
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-faint mt-0.5">
                {pastDays.length} dia{pastDays.length === 1 ? "" : "s"} · {totalPastMatches} partida{totalPastMatches === 1 ? "" : "s"}
              </div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted flex items-center gap-2">
              <span className="hidden group-open:inline">recolher</span>
              <span className="group-open:hidden">expandir</span>
              <span className="transition-transform group-open:rotate-180">▾</span>
            </div>
          </summary>
          <div className="space-y-8 px-1 pt-4 pb-2 border-t border-rule">
            {pastDays.map(([day, items]) =>
              renderDaySection(day, items, code, cfg, predById)
            )}
          </div>
        </details>
      )}

      {upcomingDays.map(([day, items]) =>
        renderDaySection(day, items, code, cfg, predById)
      )}
    </div>
  );
}

function renderDaySection(
  day: string,
  items: Match[],
  code: string,
  cfg: ScoringConfig | null,
  predById: Map<string, Prediction>
) {
  const sample = items[0];
  return (
    <section key={day} className="space-y-1">
      <div className="flex items-end justify-between border-b border-rule pb-2">
        <div>
          <div className="font-display text-xl font-bold uppercase tracking-wide">
            {fmtDayMonthLong(sample.kickoff_at)}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
            {fmtWeekday(sample.kickoff_at)} · {items.length} partida{items.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {items.map((m) => {
        const pred = predById.get(m.id) ?? null;
        const open = cfg ? isPredictionOpen(m, cfg) : false;
        const isBrazil =
          m.team_home_code === "BRA" || m.team_away_code === "BRA";
        const finished = m.status === "finished";

        return (
          <article
            id={m.id}
            key={m.id}
            className="py-4 border-b border-rule space-y-3"
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
              <span>
                {fmtTime(m.kickoff_at)} · {m.round_label}
              </span>
              {isBrazil && <span className="text-acid font-bold">Brasil 2×</span>}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FlagBar code={m.team_home_code} className="w-8 flex-shrink-0" height={3} />
                <div className="min-w-0">
                  <div className="font-display text-2xl font-extrabold uppercase tracking-tight leading-none">
                    {m.team_home_code}
                  </div>
                  <div className="text-[10px] text-bone-muted truncate">
                    {m.team_home_name}
                  </div>
                </div>
              </div>

              <div className="text-center">
                {finished ? (
                  <div className="font-mono font-bold text-2xl tabular-nums">
                    {m.official_home_score}–{m.official_away_score}
                  </div>
                ) : (
                  <div className="text-bone-muted font-mono text-sm">×</div>
                )}
              </div>

              <div className="flex items-center gap-3 justify-end min-w-0">
                <div className="text-right min-w-0">
                  <div className="font-display text-2xl font-extrabold uppercase tracking-tight leading-none">
                    {m.team_away_code}
                  </div>
                  <div className="text-[10px] text-bone-muted truncate">
                    {m.team_away_name}
                  </div>
                </div>
                <FlagBar code={m.team_away_code} className="w-8 flex-shrink-0" height={3} />
              </div>
            </div>

            {open ? (
              <PredictionInput
                matchId={m.id}
                initialHome={pred?.home_score ?? null}
                initialAway={pred?.away_score ?? null}
                initialAdvances={pred?.advances_team_code ?? null}
                isKnockout={m.phase !== "grupos"}
                homeCode={m.team_home_code}
                awayCode={m.team_away_code}
                compact
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-mono uppercase tracking-[0.16em]">
                  {pred ? (
                    <>
                      <span className="text-bone-muted">seu palpite</span>{" "}
                      <span className="text-acid font-bold">
                        {pred.home_score}–{pred.away_score}
                      </span>
                    </>
                  ) : finished ? (
                    <span className="text-bone-faint">você não palpitou</span>
                  ) : (
                    <span className="text-bone-faint">palpites encerrados</span>
                  )}
                </div>
                <Link
                  href={`/b/${code}/jogos/${m.id}`}
                  className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-acid border border-rule px-3 py-1.5 whitespace-nowrap"
                >
                  Ver palpites →
                </Link>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
