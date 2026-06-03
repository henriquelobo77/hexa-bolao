import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { fmtDayMonth, fmtTime } from "@/lib/date";
import { AdminResultForm } from "@/components/admin-result-form";
import { AdminMatchEdit } from "@/components/admin-match-edit";
import { AdminMatchAdd } from "@/components/admin-match-add";
import type { Bolao, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminJogosPage() {
  if (!(await isAdmin())) redirect("/admin");

  const admin = supabaseAdmin();
  const { data: bolao } = await admin
    .from("bolao")
    .select("*")
    .limit(1)
    .maybeSingle<Bolao>();
  const { data: matches } = await admin
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true })
    .returns<Match[]>();

  const list = matches ?? [];
  const scheduled = list.filter((m) => m.status !== "finished");
  const finished = list.filter((m) => m.status === "finished");

  return (
    <div className="hexa-container py-8 space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
            ↳ {list.length} partidas · {finished.length} finalizadas
          </div>
          <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight mt-1">
            Jogos
          </h1>
        </div>
        {bolao && <AdminMatchAdd bolaoId={bolao.id} />}
      </header>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          Pendentes · lançar resultado abaixo
        </div>
        {scheduled.slice(0, 50).map((m) => (
          <AdminMatchRow key={m.id} match={m} />
        ))}
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2">
          Finalizadas · {finished.length}
        </div>
        {finished.map((m) => (
          <AdminMatchRow key={m.id} match={m} />
        ))}
      </section>
    </div>
  );
}

function AdminMatchRow({ match }: { match: Match }) {
  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-3 py-3 border-b border-rule">
      <div className="font-mono text-[10px] text-bone-muted leading-tight">
        <div>{fmtDayMonth(match.kickoff_at)}</div>
        <div className="text-bone tabular-nums">{fmtTime(match.kickoff_at)}</div>
        <div className="text-[9px] uppercase">{match.round_label}</div>
      </div>
      <div>
        <div className="font-display text-lg font-bold uppercase tracking-tight">
          {match.team_home_code} <span className="text-bone-muted">×</span> {match.team_away_code}
        </div>
        <div className="text-[10px] text-bone-muted truncate">
          {match.team_home_name} vs {match.team_away_name}
        </div>
        <div className="mt-1">
          <AdminMatchEdit match={match} />
        </div>
      </div>
      <AdminResultForm
        matchId={match.id}
        initialHome={match.official_home_score}
        initialAway={match.official_away_score}
        status={match.status}
      />
    </div>
  );
}
