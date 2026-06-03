import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getBolaoByCodeOrSlug } from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { InviteActions } from "@/components/invite-actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ConvidarPage({ params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();
  const member = await getCurrentMember();
  if (!member) notFound();

  // Monta URL absoluta a partir dos headers (funciona em dev e prod)
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const inviteUrl = `${baseUrl}/?c=${encodeURIComponent(bolao.join_code)}`;

  // QR code via api gratuito (cores HEXA)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=svg&color=0A0A09&bgcolor=D7FF1E&qzone=2&data=${encodeURIComponent(inviteUrl)}`;

  const suggestedText = `Galera, montei bolão da Copa 2026 ⚽

Entra aqui: ${inviteUrl}
Código: ${bolao.join_code}

Vai ter ranking ao vivo, palpite de campeão e artilheiro, jogo do Brasil vale 2x e quem cravar zebra ganha bônus.

Bom palpite ✊`;

  return (
    <div className="hexa-container py-6 space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Compartilhe com a galera
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mt-1">
          Convidar
        </h1>
      </header>

      {/* Code */}
      <section className="border border-rule p-5 text-center">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          Código de entrada
        </div>
        <div className="font-display text-6xl font-extrabold uppercase tracking-[0.05em] text-acid mt-2">
          {bolao.join_code}
        </div>
      </section>

      {/* QR */}
      <section className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Aponta a câmera
        </div>
        <div className="bg-acid p-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR code para entrar no bolão ${bolao.name}`}
            width={400}
            height={400}
            className="w-full max-w-[360px] aspect-square"
          />
        </div>
      </section>

      {/* Link */}
      <section className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
          ↳ Link direto
        </div>
        <div className="bg-graphite border border-rule p-3 font-mono text-sm text-bone break-all">
          {inviteUrl}
        </div>
      </section>

      <InviteActions inviteUrl={inviteUrl} suggestedText={suggestedText} />
    </div>
  );
}
