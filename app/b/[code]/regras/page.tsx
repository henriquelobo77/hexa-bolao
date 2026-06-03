import { notFound } from "next/navigation";
import { getBolaoByCodeOrSlug, getScoringConfig } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

function Rule({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 py-3 border-b border-rule items-baseline">
      <div>
        <div className="font-display text-base font-bold uppercase tracking-wide">
          {label}
        </div>
        {note && (
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-muted mt-0.5">
            {note}
          </div>
        )}
      </div>
      <div className="font-mono font-bold text-acid text-base tabular-nums">
        {value}
      </div>
    </div>
  );
}

export default async function RegrasPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const cfg = await getScoringConfig(bolao.id);

  if (!cfg) return null;

  return (
    <div className="hexa-container py-6 space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Tabela de pontuação · v1
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Regras
        </h1>
      </header>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule">
          § Por jogo
        </div>
        <Rule label="Placar exato" value={`${cfg.pts_placar_exato} pts`} note="Acertou home e away exatos" />
        <Rule label="Empate com placar exato" value={`${cfg.pts_empate_exato} pts`} note="Mais difícil acertar — vale mais" />
        <Rule label="Acertou o vencedor" value={`${cfg.pts_vencedor} pts`} note="Vencedor certo, placar errado" />
        <Rule label="Saldo de gols" value={`+${cfg.pts_saldo} pts`} note="Adicional ao vencedor, se acertar saldo" />
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule">
          § Multiplicadores
        </div>
        <Rule label="Jogos do Brasil" value={`${cfg.mult_brasil}×`} note="Brasil em campo dobra (ou mais)" />
        <Rule label="Oitavas de final" value={`${cfg.mult_oitavas}×`} />
        <Rule label="Quartas de final" value={`${cfg.mult_quartas}×`} />
        <Rule label="Semifinal" value={`${cfg.mult_semi}×`} />
        <Rule label="Final" value={`${cfg.mult_final}×`} />
      </section>

      {cfg.bonus_zebra_enabled && (
        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule">
            § Bônus zebra
          </div>
          <Rule
            label="Cravar sozinho"
            value={`+${cfg.bonus_zebra_pts} pts`}
            note={
              cfg.bonus_zebra_max_hits === 1
                ? "Quando você é o único a acertar o placar exato"
                : `Quando até ${cfg.bonus_zebra_max_hits} pessoas acertaram o mesmo placar exato`
            }
          />
        </section>
      )}

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule">
          § Palpites únicos
        </div>
        <Rule label="Campeão" value={`${cfg.pts_campeao} pts`} note="Acertou quem levanta a taça" />
        <Rule label="Artilheiro" value={`${cfg.pts_artilheiro} pts`} note="Acertou o goleador da Copa" />
        {cfg.enable_vice && (
          <Rule label="Vice-campeão" value={`${cfg.pts_vice} pts`} />
        )}
        {cfg.enable_semifinalistas && (
          <Rule label="Cada semifinalista" value={`${cfg.pts_semifinalista} pts`} note="Até 4 seleções, 1 ponto por acerto" />
        )}
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule">
          § Deadline
        </div>
        <Rule
          label="Palpite trava em"
          value={cfg.predict_deadline_min === 0 ? "Apito inicial" : `${cfg.predict_deadline_min}min antes`}
        />
      </section>
    </div>
  );
}
