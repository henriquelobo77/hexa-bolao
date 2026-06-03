"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Props {
  bolaoId: string;
  serverRenderAt: string;
}

export function RealtimeRefresh({ bolaoId, serverRenderAt: _serverRenderAt }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const throttleAt = useRef(0);
  // Status/contador permanecem em memória pra diagnóstico via console.log,
  // mas o widget visual não é mais renderizado.

  useEffect(() => {
    const supabase = supabaseBrowser();
    console.log("[realtime] subscribing to bolao:", bolaoId);

    function refresh(source: string, payload?: unknown) {
      console.log(`[realtime] ${source}`, payload);
      const now = Date.now();
      const wait = Math.max(0, 500 - (now - throttleAt.current));
      throttleAt.current = now + wait;
      setTimeout(() => {
        startTransition(() => router.refresh());
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
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bolaoId, router]);

  return null;
}
