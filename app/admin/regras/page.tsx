import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { AdminScoringForm } from "@/components/admin-scoring-form";
import type { Bolao, ScoringConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRegrasPage() {
  if (!(await isAdmin())) redirect("/admin");

  const admin = supabaseAdmin();
  const { data: bolao } = await admin
    .from("bolao")
    .select("*")
    .limit(1)
    .maybeSingle<Bolao>();
  if (!bolao) return <div className="hexa-container py-8">Nenhum bolão.</div>;

  const { data: cfg } = await admin
    .from("scoring_config")
    .select("*")
    .eq("bolao_id", bolao.id)
    .maybeSingle<ScoringConfig>();
  if (!cfg) return <div className="hexa-container py-8">Config ausente.</div>;

  return (
    <div className="hexa-container py-8 space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Bolão: {bolao.name}
        </div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight mt-1">
          Regras
        </h1>
      </header>
      <AdminScoringForm config={cfg} />
    </div>
  );
}
