import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { AdminSyncButton } from "@/components/admin-sync-button";
import { AdminCreateBolaoForm } from "@/components/admin-create-bolao-form";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (!(await isAdmin())) redirect("/admin");

  const admin = supabaseAdmin();
  const [{ data: bolaos }, { count: matchCount }, { count: memberCount }, { count: predCount }] =
    await Promise.all([
      admin.from("bolao").select("id, name, join_code, slug, starts_at, max_members"),
      admin.from("matches").select("*", { count: "exact", head: true }),
      admin.from("members").select("*", { count: "exact", head: true }),
      admin.from("predictions").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="hexa-container py-8 space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Visão geral
        </div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight mt-1">
          Dashboard
        </h1>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Bolões", value: bolaos?.length ?? 0 },
          { label: "Partidas", value: matchCount ?? 0 },
          { label: "Membros", value: memberCount ?? 0 },
          { label: "Palpites", value: predCount ?? 0 },
        ].map((s) => (
          <div key={s.label} className="border border-rule p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-2">
              {s.label}
            </div>
            <div className="font-mono font-bold text-3xl tabular-nums">{s.value}</div>
          </div>
        ))}
      </section>

      {/* Bolões */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Bolões cadastrados
        </div>
        {(bolaos ?? []).map((b) => (
          <div
            key={b.id as string}
            className="flex items-center justify-between py-3 border-b border-rule"
          >
            <div>
              <div className="font-display text-lg font-bold uppercase">{b.name as string}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
                Código: <span className="text-acid">{b.join_code as string}</span>
                {b.max_members != null && <span className="ml-2">· cap {b.max_members as number}</span>}
                <Link
                  href={`/b/${b.join_code as string}`}
                  className="text-bone-muted hover:text-bone ml-2"
                >
                  abrir
                </Link>
              </div>
            </div>
            <Link
              href="/admin/jogos"
              className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted hover:text-acid border border-rule px-3 py-2"
            >
              Gerenciar →
            </Link>
          </div>
        ))}
      </section>

      {/* Sync */}
      <section>
        <AdminSyncButton />
      </section>

      {/* Export CSV */}
      <section className="border border-rule p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted mb-3">
          ↳ Exportar dados (CSV)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { kind: "ranking", label: "Ranking" },
            { kind: "predictions", label: "Palpites + pontos" },
            { kind: "members", label: "Membros" },
          ].map((e) => (
            <a
              key={e.kind}
              href={`/api/admin/export?kind=${e.kind}`}
              download
              className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 py-2.5 text-center hover:bg-acid hover:text-black transition"
            >
              {e.label} →
            </a>
          ))}
        </div>
      </section>

      {/* Atalhos */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { href: "/admin/jogos", label: "Lançar resultados" },
          { href: "/admin/regras", label: "Configurar regras" },
          { href: "/admin/especiais", label: "Resultados especiais" },
          { href: "/admin/membros", label: "Gerenciar membros" },
          { href: "/admin/resumo", label: "Resumo do dia" },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border border-rule p-4 hover:border-acid hover:bg-graphite/40 transition"
          >
            <div className="font-display text-lg font-bold uppercase tracking-tight">
              {s.label}
            </div>
          </Link>
        ))}
      </section>

      {/* Novo bolão */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted pb-2 border-b border-rule mb-3">
          Novo bolão (multi-bolão)
        </div>
        <AdminCreateBolaoForm />
      </section>
    </div>
  );
}
