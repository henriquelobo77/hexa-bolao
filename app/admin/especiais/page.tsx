import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { teamNames } from "@/lib/fixtures";
import { AdminSpecialResultForm } from "@/components/admin-special-result-form";
import type { Bolao, ScoringConfig, SpecialResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEspeciaisPage() {
  if (!(await isAdmin())) redirect("/admin");

  const admin = supabaseAdmin();
  const { data: bolao } = await admin
    .from("bolao")
    .select("*")
    .limit(1)
    .maybeSingle<Bolao>();
  if (!bolao) return null;
  const { data: cfg } = await admin
    .from("scoring_config")
    .select("*")
    .eq("bolao_id", bolao.id)
    .maybeSingle<ScoringConfig>();
  const { data: results } = await admin
    .from("special_results")
    .select("*")
    .eq("bolao_id", bolao.id)
    .returns<SpecialResult[]>();

  const find = (kind: string, position = 1) =>
    (results ?? []).find((r) => r.kind === kind && r.position === position)?.value ?? "";

  const teams = Object.entries(teamNames)
    .filter(([code]) => code !== "TBD")
    .map(([, name]) => name)
    .sort();

  return (
    <div className="hexa-container py-8 space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Bolão: {bolao.name}
        </div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight mt-1">
          Especiais (oficial)
        </h1>
      </header>

      <AdminSpecialResultForm
        bolaoId={bolao.id}
        kind="campeao"
        label="Campeão"
        options={teams}
        initial={find("campeao")}
      />
      <AdminSpecialResultForm
        bolaoId={bolao.id}
        kind="artilheiro"
        label="Artilheiro"
        initial={find("artilheiro")}
        freeText
      />
      {cfg?.enable_vice && (
        <AdminSpecialResultForm
          bolaoId={bolao.id}
          kind="vice"
          label="Vice-campeão"
          options={teams}
          initial={find("vice")}
        />
      )}
      {cfg?.enable_semifinalistas &&
        [1, 2, 3, 4].map((pos) => (
          <AdminSpecialResultForm
            key={pos}
            bolaoId={bolao.id}
            kind="semifinalista"
            position={pos}
            label={`Semifinalista ${pos}`}
            options={teams}
            initial={find("semifinalista", pos)}
          />
        ))}
    </div>
  );
}
