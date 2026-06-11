import Link from "next/link";
import { isAdmin } from "@/lib/session";
import { adminLogout } from "@/lib/actions/admin";
import { getCurrentAdminBolao } from "@/lib/admin-bolao";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdmin();
  const activeBolao = authed ? await getCurrentAdminBolao() : null;

  return (
    <div className="min-h-dvh flex flex-col pb-16">
      {authed && (
        <header className="bg-graphite/40 border-b border-rule">
          <div className="hexa-container flex items-center justify-between py-3 flex-wrap gap-3">
            <div className="flex items-center gap-5 text-[10px] font-mono uppercase tracking-[0.18em] flex-wrap">
              <Link href="/admin/dashboard" className="text-bone font-bold">
                HEXA · Admin
              </Link>
              <Link href="/admin/jogos" className="text-bone-muted hover:text-bone">Jogos</Link>
              <Link href="/admin/regras" className="text-bone-muted hover:text-bone">Regras</Link>
              <Link href="/admin/especiais" className="text-bone-muted hover:text-bone">Especiais</Link>
              <Link href="/admin/membros" className="text-bone-muted hover:text-bone">Membros</Link>
              <Link href="/admin/resumo" className="text-bone-muted hover:text-bone">Resumo</Link>
            </div>
            <div className="flex items-center gap-3">
              {activeBolao && (
                <Link
                  href="/admin/dashboard"
                  className="text-[10px] font-mono uppercase tracking-[0.16em] text-acid border border-acid px-2 py-1 hover:bg-acid hover:text-black transition"
                  title="Clique pra trocar o bolão ativo"
                >
                  {activeBolao.name}
                </Link>
              )}
              <form action={adminLogout}>
                <button
                  type="submit"
                  className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted hover:text-warning"
                >
                  Sair →
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
