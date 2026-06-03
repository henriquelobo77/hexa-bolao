import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { AdminRemoveMemberButton } from "@/components/admin-remove-member-button";
import { fmtDateTime } from "@/lib/date";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminMembrosPage() {
  if (!(await isAdmin())) redirect("/admin");

  const admin = supabaseAdmin();
  const { data: members } = await admin
    .from("members")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<Member[]>();

  const list = members ?? [];

  return (
    <div className="hexa-container py-8 space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ {list.length} membro{list.length === 1 ? "" : "s"}
        </div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight mt-1">
          Membros
        </h1>
      </header>

      <section className="border border-rule">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted border-b border-rule">
          <span>Apelido</span>
          <span>Entrou em</span>
          <span></span>
        </div>
        {list.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 items-baseline border-t border-rule"
          >
            <span className="font-display text-lg font-bold uppercase tracking-tight">
              {m.nickname}
            </span>
            <span className="font-mono text-[10px] text-bone-muted uppercase tracking-[0.14em]">
              {fmtDateTime(m.created_at)}
            </span>
            <AdminRemoveMemberButton memberId={m.id} />
          </div>
        ))}
        {list.length === 0 && (
          <div className="px-4 py-10 text-center text-bone-muted">
            Ninguém entrou ainda.
          </div>
        )}
      </section>
    </div>
  );
}
