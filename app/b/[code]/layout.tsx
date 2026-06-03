import { redirect, notFound } from "next/navigation";
import { getBolaoByCodeOrSlug } from "@/lib/queries";
import { getCurrentMember } from "@/lib/actions/member";
import { BolaoHeader } from "@/components/bolao-header";
import { BolaoNav } from "@/components/bolao-nav";
import { RealtimeRefresh } from "@/components/realtime-refresh";

interface Props {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}

export default async function BolaoLayout({ children, params }: Props) {
  const { code } = await params;
  const bolao = await getBolaoByCodeOrSlug(code);
  if (!bolao) notFound();

  const member = await getCurrentMember();
  if (!member || member.bolao_id !== bolao.id) {
    redirect("/");
  }

  // Timestamp do render do servidor — visível no canto pra debug do realtime
  const serverRenderAt = new Date().toLocaleTimeString("pt-BR", {
    hour12: false,
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div className="relative min-h-dvh flex flex-col pb-24">
      <BolaoHeader bolaoName={bolao.name} memberNickname={member.nickname} />
      <main className="flex-1">{children}</main>
      <BolaoNav code={code} />
      <RealtimeRefresh bolaoId={bolao.id} serverRenderAt={serverRenderAt} />
    </div>
  );
}
