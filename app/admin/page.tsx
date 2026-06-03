import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/session";
import { AdminLoginForm } from "@/components/admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin/dashboard");

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="hexa-container flex items-center justify-between pt-6 pb-4 text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
        <Link href="/" className="text-bone font-semibold tracking-[0.22em] hover:text-acid">
          ← HEXA
        </Link>
        <span>Admin</span>
      </header>

      <section className="hexa-container flex-1 flex flex-col justify-center py-12">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-5">
          ↳ Acesso restrito
        </div>
        <h1 className="font-display text-[clamp(56px,12vw,128px)] leading-[0.85] tracking-tight">
          ADMIN
        </h1>
        <p className="mt-4 text-bone-muted max-w-md">
          Senha definida em <span className="font-mono text-bone">ADMIN_PASSWORD</span> no .env.
        </p>
        <div className="mt-10 max-w-sm">
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
