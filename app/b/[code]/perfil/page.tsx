import { notFound } from "next/navigation";
import { getBolaoByCodeOrSlug, getRanking, getPredictionsForMember } from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { PerfilForm } from "@/components/perfil-form";
import { LeaveButton } from "@/components/leave-button";
import { fmtDateTime } from "@/lib/date";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function PerfilPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const [ranking, predictions] = await Promise.all([
    getRanking(bolao.id),
    getPredictionsForMember(member.id),
  ]);
  const me = ranking.find((r) => r.member_id === member.id);

  return (
    <div className="hexa-container py-6 space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Seu perfil neste bolão
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Perfil
        </h1>
      </header>

      {/* Stats card */}
      <section className="grid grid-cols-3 gap-3">
        <div className="border border-rule p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-2">
            Posição
          </div>
          <div className="font-mono font-bold text-3xl tabular-nums text-acid">
            {me ? String(me.rank).padStart(2, "0") : "—"}
          </div>
        </div>
        <div className="border border-rule p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-2">
            Pontos
          </div>
          <div className="font-mono font-bold text-3xl tabular-nums">
            {me ? String(me.total_points).padStart(3, "0") : "000"}
          </div>
        </div>
        <div className="border border-rule p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-2">
            Palpites
          </div>
          <div className="font-mono font-bold text-3xl tabular-nums">
            {predictions.length}
          </div>
        </div>
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Trocar apelido
        </div>
        <PerfilForm initialNick={member.nickname} />
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Atalhos
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <a
            href={`/b/${code}/convidar`}
            className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 py-3 text-center hover:bg-acid hover:text-black transition"
          >
            Convidar →
          </a>
          <a
            href={`/b/${code}/stats`}
            className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 py-3 text-center hover:bg-acid hover:text-black transition"
          >
            Suas stats →
          </a>
          <a
            href={`/b/${code}/regras`}
            className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 py-3 text-center hover:bg-acid hover:text-black transition"
          >
            Regras →
          </a>
        </div>
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Sessão
        </div>
        <div className="font-mono text-xs text-bone-muted mb-3">
          Entrou em {fmtDateTime(member.created_at)} · Bolão {bolao.name}
        </div>
        <LeaveButton />
      </section>
    </div>
  );
}
