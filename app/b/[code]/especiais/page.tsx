import { notFound } from "next/navigation";
import {
  getBolaoByCodeOrSlug,
  getScoringConfig,
  getSpecialPicksForMember,
  getSpecialResults,
} from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { SpecialPickForm } from "@/components/special-pick-form";
import { teamNames } from "@/lib/fixtures";
import { scorers } from "@/lib/scorers";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function EspeciaisPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  const [cfg, picks, results] = await Promise.all([
    getScoringConfig(bolao.id),
    getSpecialPicksForMember(member.id),
    getSpecialResults(bolao.id),
  ]);

  const myPick = (kind: string, position = 1) =>
    picks.find((p) => p.kind === kind && p.position === position);
  const officialPick = (kind: string, position = 1) =>
    results.find((r) => r.kind === kind && r.position === position);

  const open = new Date(bolao.starts_at).getTime() > Date.now();

  const teamOptions = Object.entries(teamNames)
    .filter(([code]) => code !== "TBD")
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="hexa-container py-6 space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Palpites únicos · valem muito
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Especiais
        </h1>
        {!open && (
          <div className="text-warning text-sm font-mono uppercase tracking-wide mt-3">
            ↳ Palpites especiais encerrados — a Copa já começou.
          </div>
        )}
      </header>

      {/* Campeão */}
      <section className="border border-rule p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
              Campeão da Copa
            </div>
            <div className="font-display text-xl font-bold uppercase tracking-tight">
              Quem levanta a taça?
            </div>
          </div>
          {cfg && (
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-acid">
              Vale {cfg.pts_campeao} pts
            </div>
          )}
        </div>
        <SpecialPickForm
          kind="campeao"
          options={teamOptions.map((t) => ({ value: t.name, label: t.name }))}
          initial={myPick("campeao")?.value ?? ""}
          official={officialPick("campeao")?.value}
          disabled={!open}
          placeholder="Escolher seleção..."
        />
      </section>

      {/* Artilheiro */}
      <section className="border border-rule p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
              Artilheiro
            </div>
            <div className="font-display text-xl font-bold uppercase tracking-tight">
              Quem fura a rede do gol?
            </div>
          </div>
          {cfg && (
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-acid">
              Vale {cfg.pts_artilheiro} pts
            </div>
          )}
        </div>
        <SpecialPickForm
          kind="artilheiro"
          initial={myPick("artilheiro")?.value ?? ""}
          official={officialPick("artilheiro")?.value}
          disabled={!open}
          placeholder="Digita o nome do jogador..."
          datalist={scorers
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => ({ value: s.name, hint: s.team }))}
        />
      </section>

      {/* Vice (se habilitado) */}
      {cfg?.enable_vice && (
        <section className="border border-rule p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
                Vice-campeão
              </div>
              <div className="font-display text-xl font-bold uppercase tracking-tight">
                Quem perde a final?
              </div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-acid">
              Vale {cfg.pts_vice} pts
            </div>
          </div>
          <SpecialPickForm
            kind="vice"
            options={teamOptions.map((t) => ({ value: t.name, label: t.name }))}
            initial={myPick("vice")?.value ?? ""}
            official={officialPick("vice")?.value}
            disabled={!open}
            placeholder="Escolher seleção..."
          />
        </section>
      )}

      {/* Semifinalistas (se habilitado) */}
      {cfg?.enable_semifinalistas && (
        <section className="border border-rule p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
                Semifinalistas
              </div>
              <div className="font-display text-xl font-bold uppercase tracking-tight">
                As 4 seleções que chegam na semi
              </div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-acid">
              {cfg.pts_semifinalista} pts cada acerto
            </div>
          </div>
          {[1, 2, 3, 4].map((pos) => (
            <SpecialPickForm
              key={pos}
              kind="semifinalista"
              position={pos}
              options={teamOptions.map((t) => ({ value: t.name, label: t.name }))}
              initial={myPick("semifinalista", pos)?.value ?? ""}
              official={officialPick("semifinalista", pos)?.value}
              disabled={!open}
              placeholder={`Semifinalista ${pos}...`}
            />
          ))}
        </section>
      )}
    </div>
  );
}
