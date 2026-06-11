import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentAdminBolao } from "@/lib/admin-bolao";
import { AdminRemoveMemberButton } from "@/components/admin-remove-member-button";
import { AdminResetPinButton } from "@/components/admin-reset-pin-button";
import { fmtDateTime } from "@/lib/date";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminMembrosPage() {
  if (!(await isAdmin())) redirect("/admin");

  const bolao = await getCurrentAdminBolao();
  const admin = supabaseAdmin();
  const { data: members } = await admin
    .from("members")
    .select("*")
    .eq("bolao_id", bolao?.id ?? "")
    .order("created_at", { ascending: true })
    .returns<Member[]>();

  const list = members ?? [];
  const withPin = list.filter((m) => m.pin_hash).length;

  return (
    <div className="hexa-container py-8 space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Bolão ativo: {bolao?.name ?? "—"}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          {list.length} membro{list.length === 1 ? "" : "s"} · {withPin} com PIN
        </div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight mt-1">
          Membros
        </h1>
      </header>

      <section className="border border-rule">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted border-b border-rule">
          <span>Apelido</span>
          <span>Entrou em</span>
          <span>PIN</span>
          <span></span>
        </div>
        {list.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 items-baseline border-t border-rule"
          >
            <span className="font-display text-lg font-bold uppercase tracking-tight truncate">
              {m.nickname}
            </span>
            <span className="font-mono text-[10px] text-bone-muted uppercase tracking-[0.14em]">
              {fmtDateTime(m.created_at)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
              {m.pin_hash ? (
                <span className="text-acid">●</span>
              ) : (
                <span className="text-warning">○</span>
              )}
            </span>
            <div className="flex gap-2">
              <AdminResetPinButton memberId={m.id} hasPin={Boolean(m.pin_hash)} />
              <AdminRemoveMemberButton memberId={m.id} />
            </div>
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
