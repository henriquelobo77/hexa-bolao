import { notFound } from "next/navigation";
import { getBolaoByCodeOrSlug, getRanking } from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function RankingPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const ranking = await getRanking(bolao.id);

  return (
    <div className="hexa-container py-6 space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ {ranking.length} membros
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Ranking
        </h1>
      </header>

      <section className="border border-rule">
        <div className="grid grid-cols-[40px_1fr_auto_70px] gap-3 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted border-b border-rule">
          <span>Pos</span>
          <span>Membro</span>
          <span className="text-right hidden md:block">Palpites</span>
          <span className="text-right">Pontos</span>
        </div>
        {ranking.length === 0 && (
          <div className="px-4 py-10 text-center text-bone-muted">
            Ninguém entrou ainda.
          </div>
        )}
        {ranking.map((r) => {
          const isMe = r.member_id === member.id;
          const isTop = r.rank === 1;
          return (
            <div
              key={r.member_id}
              className={`grid grid-cols-[40px_1fr_auto_70px] gap-3 px-4 py-3 items-baseline border-t border-rule transition-colors ${
                isMe ? "bg-graphite/60" : ""
              }`}
            >
              <span
                className={`font-mono font-bold text-base tabular-nums ${
                  isTop ? "text-acid" : isMe ? "text-acid" : "text-bone-muted"
                }`}
              >
                {String(r.rank).padStart(2, "0")}
              </span>
              <span
                className={`font-display text-xl font-bold uppercase tracking-tight truncate ${
                  isMe ? "text-acid" : ""
                }`}
              >
                {r.nickname}
                {isMe && (
                  <span className="ml-2 text-[10px] font-mono text-bone-muted tracking-[0.16em]">
                    (você)
                  </span>
                )}
              </span>
              <span className="text-right font-mono text-sm text-bone-muted tabular-nums hidden md:block">
                {r.predictions_made}
              </span>
              <span
                className={`text-right font-mono font-bold text-base tabular-nums ${
                  isMe ? "text-acid" : ""
                }`}
              >
                {String(r.total_points).padStart(3, "0")}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
