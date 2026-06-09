import { notFound } from "next/navigation";
import {
  getBolaoByCodeOrSlug,
  getMembers,
  getScoringConfig,
  getSpecialPicksForBolao,
  getSpecialPicksForMember,
  getSpecialResults,
} from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { SpecialPickForm } from "@/components/special-pick-form";
import { teamNames } from "@/lib/fixtures";
import { scorers } from "@/lib/scorers";
import type { SpecialPick } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

const KIND_LABEL: Record<string, string> = {
  campeao: "Campeão",
  artilheiro: "Artilheiro",
  vice: "Vice-campeão",
  semifinalista: "Semifinalista",
};

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

  // Quando os palpites travam, busca quem palpitou em quem
  const [allPicks, members] = open
    ? [[] as SpecialPick[], []]
    : await Promise.all([getSpecialPicksForBolao(bolao.id), getMembers(bolao.id)]);
  const memberById = new Map(members.map((m) => [m.id, m]));

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

      {/* PALPITES DA GALERA — só aparece quando travado */}
      {!open && allPicks.length > 0 && (
        <section className="space-y-4 pt-4 border-t-2 border-rule-strong">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
              ↳ Travado · revelados
            </div>
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight mt-1">
              Palpites da galera
            </h2>
          </div>

          {(["campeao", "artilheiro", "vice", "semifinalista"] as const).map((kind) => {
            const kindPicks = allPicks.filter((p) => p.kind === kind);
            if (kindPicks.length === 0) return null;
            const official = officialPick(kind);

            // Agrupa por valor (case-insensitive)
            const byValue = new Map<string, string[]>();
            for (const p of kindPicks) {
              const key = p.value.trim();
              const nick = memberById.get(p.member_id)?.nickname ?? "?";
              if (!byValue.has(key)) byValue.set(key, []);
              byValue.get(key)!.push(nick);
            }

            const rows = Array.from(byValue.entries())
              .map(([value, nicks]) => ({ value, nicks }))
              .sort((a, b) => b.nicks.length - a.nicks.length);

            const total = kindPicks.length;

            return (
              <div key={kind} className="border border-rule">
                <div className="flex items-baseline justify-between px-4 py-3 border-b border-rule bg-graphite/40">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
                      {KIND_LABEL[kind]}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-faint mt-0.5">
                      {total} palpite{total === 1 ? "" : "s"} · {rows.length} opç{rows.length === 1 ? "ão" : "ões"} diferente{rows.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  {official && (
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-acid">
                      ✓ Oficial: {official.value}
                    </div>
                  )}
                </div>

                {rows.map((row) => {
                  const isHit =
                    official &&
                    row.value.toLowerCase() === official.value.toLowerCase();
                  const pct = Math.round((row.nicks.length / total) * 100);
                  return (
                    <div
                      key={row.value}
                      className="px-4 py-3 border-t border-rule first:border-t-0"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="font-display text-base font-bold uppercase tracking-tight truncate">
                          {row.value}
                          {isHit && (
                            <span className="ml-2 text-[10px] font-mono text-acid">
                              ✓ ACERTOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-muted whitespace-nowrap">
                          {row.nicks.length}/{total} · {pct}%
                        </div>
                      </div>
                      {/* Barra visual */}
                      <div className="relative bg-graphite h-1.5 mt-2 mb-2">
                        <div
                          className={`absolute inset-y-0 left-0 ${isHit ? "bg-acid" : "bg-bone-muted"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-faint leading-tight">
                        {row.nicks.join(" · ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
