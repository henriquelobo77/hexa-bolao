import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { getCurrentAdminBolao } from "@/lib/admin-bolao";
import { buildDailyRecap } from "@/lib/recap";
import { RecapActions } from "@/components/recap-actions";
import { dayKeyBR } from "@/lib/date";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ dia?: string }>;
}

export default async function AdminResumoPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect("/admin");

  const bolao = await getCurrentAdminBolao();
  if (!bolao) return null;

  const sp = await searchParams;
  const dia = sp.dia ?? dayKeyBR(new Date().toISOString());

  const recap = await buildDailyRecap(bolao.id, dia);

  return (
    <div className="hexa-container py-8 space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Bolão ativo: {bolao.name}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Resumo do dia
        </h1>
      </header>

      {/* Seletor de data */}
      <section className="border border-rule p-4">
        <form action="/admin/resumo" method="get" className="flex items-center gap-3">
          <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
            Data
          </label>
          <input
            type="date"
            name="dia"
            defaultValue={dia}
            className="bg-pitch-deep border border-rule px-3 py-2 text-bone font-mono focus:border-acid focus:outline-none"
          />
          <button
            type="submit"
            className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 py-2 hover:bg-acid hover:text-black transition"
          >
            Gerar →
          </button>
        </form>
      </section>

      {recap ? (
        <>
          {/* Stats */}
          <section className="grid grid-cols-3 gap-2">
            <div className="border border-rule p-3">
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
                Jogos
              </div>
              <div className="font-mono font-bold text-2xl tabular-nums mt-1">
                {recap.matchesToday.length}
              </div>
            </div>
            <div className="border border-rule p-3">
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
                Finalizados
              </div>
              <div className="font-mono font-bold text-2xl tabular-nums mt-1">
                {recap.matchesToday.filter((m) => m.finished).length}
              </div>
            </div>
            <div className="border border-rule p-3">
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-bone-muted">
                Top do dia
              </div>
              <div className="font-mono font-bold text-base truncate mt-1 text-acid">
                {recap.topScorers[0]?.nickname ?? "—"}
              </div>
            </div>
          </section>

          {/* Preview */}
          <section>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-2 flex items-baseline justify-between">
              <span>Mensagem pronta</span>
              <span>{recap.text.length} caracteres</span>
            </div>
            <pre className="bg-graphite border border-rule p-4 text-sm text-bone font-body whitespace-pre-wrap leading-relaxed">
{recap.text}
            </pre>
          </section>

          <RecapActions text={recap.text} />
        </>
      ) : (
        <div className="border border-rule p-8 text-center text-bone-muted">
          Sem jogos nesse dia ainda.
        </div>
      )}
    </div>
  );
}
