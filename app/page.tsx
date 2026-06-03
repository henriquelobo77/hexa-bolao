import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentMember } from "@/lib/actions/member";
import { supabaseServer } from "@/lib/supabase";
import { JoinForm } from "@/components/join-form";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  // Se já tem cookie de membro, manda direto pro bolão
  const member = await getCurrentMember();
  if (member) {
    const supabase = await supabaseServer();
    const { data } = await supabase
      .from("bolao")
      .select("join_code")
      .eq("id", member.bolao_id)
      .maybeSingle<{ join_code: string }>();
    if (data) redirect(`/b/${data.join_code}`);
  }

  // Se veio com ?c=CODIGO via link de convite, pré-preenche
  const sp = await searchParams;
  const presetCode = sp?.c?.toUpperCase().slice(0, 32) ?? "";

  return (
    <main className="relative min-h-dvh flex flex-col">
      {/* Top bar */}
      <header className="hexa-container flex items-center justify-between pt-6 pb-4 text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
        <span className="text-bone font-semibold tracking-[0.22em]">HEXA</span>
        <span className="flex items-center gap-2">
          <span className="hexa-pulse inline-block w-1.5 h-1.5 rounded-full bg-acid" />
          Copa 2026
        </span>
      </header>

      {/* Hero */}
      <section className="hexa-container flex-1 flex flex-col justify-center py-12 md:py-20">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-5">
          ↳ Etapa 01 · Entrar no bolão
        </div>

        <h1 className="font-display text-[clamp(72px,18vw,180px)] leading-[0.85] tracking-tight">
          HE<span className="text-acid">X</span>A
        </h1>

        <p className="mt-6 max-w-md text-bone-muted text-base md:text-lg leading-snug">
          Bolão da Copa do Mundo 2026.
          <br />
          Digite o código do seu grupo e seu apelido pra entrar.
        </p>

        <div className="mt-12 max-w-md">
          <JoinForm presetCode={presetCode} />
        </div>
      </section>

      {/* Footer */}
      <footer className="hexa-container py-8 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted border-t border-rule">
        <span>v1.0 · 11 jun 2026</span>
        <Link href="/admin" className="hover:text-bone transition-colors">
          Admin →
        </Link>
      </footer>
    </main>
  );
}
