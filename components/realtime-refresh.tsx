"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Props {
  bolaoId: string;
  serverRenderAt: string;
}

type Status = "connecting" | "live" | "error" | "closed";

export function RealtimeRefresh({ bolaoId, serverRenderAt }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("connecting");
  const [eventCount, setEventCount] = useState(0);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const throttleAt = useRef(0);

  useEffect(() => {
    const supabase = supabaseBrowser();
    console.log("[realtime] subscribing to bolao:", bolaoId);

    function refresh(source: string, payload?: unknown) {
      const ts = new Date().toLocaleTimeString("pt-BR", { hour12: false });
      console.log(`[realtime] evento ${source} @ ${ts}`, payload);
      setEventCount((n) => n + 1);
      setLastEventAt(ts);

      const now = Date.now();
      const wait = Math.max(0, 500 - (now - throttleAt.current));
      throttleAt.current = now + wait;

      setTimeout(() => {
        console.log(`[realtime] chamando router.refresh() @ ${new Date().toLocaleTimeString("pt-BR", { hour12: false })}`);
        startTransition(() => {
          router.refresh();
        });
      }, wait);
    }

    const channel = supabase
      .channel(`bolao:${bolaoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `bolao_id=eq.${bolaoId}` },
        (p) => refresh(`matches.${p.eventType}`, p.new)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions" },
        (p) => refresh(`predictions.${p.eventType}`, p.new)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "special_results", filter: `bolao_id=eq.${bolaoId}` },
        (p) => refresh(`special_results.${p.eventType}`, p.new)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "special_picks" },
        (p) => refresh(`special_picks.${p.eventType}`, p.new)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scoring_config", filter: `bolao_id=eq.${bolaoId}` },
        (p) => refresh(`scoring_config.${p.eventType}`, p.new)
      )
      .subscribe((subStatus, err) => {
        console.log("[realtime] subscribe status:", subStatus, err ?? "");
        if (subStatus === "SUBSCRIBED") setStatus("live");
        else if (subStatus === "CHANNEL_ERROR" || subStatus === "TIMED_OUT") setStatus("error");
        else if (subStatus === "CLOSED") setStatus("closed");
      });

    return () => {
      console.log("[realtime] unsubscribing");
      supabase.removeChannel(channel);
    };
  }, [bolaoId, router]);

  const labels: Record<Status, { text: string; color: string }> = {
    connecting: { text: "conectando", color: "text-bone-muted" },
    live: { text: "ao vivo", color: "text-acid" },
    error: { text: "erro realtime", color: "text-warning" },
    closed: { text: "desconectado", color: "text-warning" },
  };
  const { text, color } = labels[status];

  return (
    <div
      className={`fixed bottom-28 right-3 z-40 flex flex-col items-end gap-0.5 bg-pitch-deep/90 border border-rule px-2 py-1 text-[9px] font-mono uppercase tracking-[0.16em] ${color}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`inline-block w-1.5 h-1.5 rounded-full bg-current ${status === "live" ? "hexa-pulse" : ""}`} />
        {text}
        {eventCount > 0 && <span className="text-bone-faint normal-case">· {eventCount} ev</span>}
      </div>
      <div className="text-bone-faint normal-case tracking-normal text-[8px]">
        srv {serverRenderAt}
        {lastEventAt && ` · ev ${lastEventAt}`}
      </div>
    </div>
  );
}
