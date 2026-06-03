import Link from "next/link";
import { FlagBar } from "./flag-bar";
import { fmtDayMonth, fmtTime } from "@/lib/date";
import type { Match, Prediction } from "@/lib/types";

interface Props {
  match: Match;
  prediction?: Prediction | null;
  href?: string;
  showVenue?: boolean;
  highlight?: boolean;
}

function pickResultLabel(m: Match): string | null {
  if (
    m.official_home_score === null ||
    m.official_away_score === null ||
    m.status !== "finished"
  ) {
    return null;
  }
  return `${m.official_home_score}–${m.official_away_score}`;
}

export function MatchCard({
  match,
  prediction,
  href,
  showVenue = false,
  highlight = false,
}: Props) {
  const isBrazil =
    match.team_home_code === "BRA" || match.team_away_code === "BRA";
  const result = pickResultLabel(match);
  const hasGuess =
    prediction && prediction.home_score !== undefined && prediction.away_score !== undefined;

  const card = (
    <article
      className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 py-3 px-3 -mx-3 border-t border-rule transition-colors ${
        highlight ? "bg-graphite/40" : "hover:bg-graphite/30"
      }`}
    >
      {/* When */}
      <div className="font-mono text-[10px] leading-tight text-bone-muted">
        <div>{fmtDayMonth(match.kickoff_at)}</div>
        <div className="text-bone font-semibold text-[12px] tabular-nums">
          {fmtTime(match.kickoff_at)}
        </div>
      </div>

      {/* Teams */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-base md:text-lg">
          <FlagBar code={match.team_home_code} className="w-6" />
          <span className="font-display font-bold tracking-tight uppercase truncate">
            {match.team_home_code}
          </span>
          <span className="font-mono text-bone-muted text-[11px] px-1">×</span>
          <span className="font-display font-bold tracking-tight uppercase truncate">
            {match.team_away_code}
          </span>
          <FlagBar code={match.team_away_code} className="w-6" />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.16em] text-bone-faint">
          {match.round_label && <span className="truncate">{match.round_label}</span>}
          {isBrazil && <span className="text-acid">· BRA 2×</span>}
          {showVenue && match.venue && (
            <span className="truncate hidden md:inline">· {match.venue}</span>
          )}
        </div>
      </div>

      {/* Status / prediction */}
      <div className="text-right">
        {result ? (
          <div className="font-mono font-bold text-base text-bone tabular-nums">
            {result}
          </div>
        ) : hasGuess ? (
          <div className="font-mono font-bold text-base text-acid tabular-nums">
            {prediction.home_score}–{prediction.away_score}
          </div>
        ) : (
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-muted border border-rule px-2 py-1">
            Palpitar
          </div>
        )}
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
