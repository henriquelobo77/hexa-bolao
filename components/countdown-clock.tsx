"use client";

import { useEffect, useState } from "react";
import { fmtCountdownClock, msUntil } from "@/lib/date";

interface Props {
  target: string; // ISO
  className?: string;
  showLabel?: boolean;
}

export function CountdownClock({ target, className = "", showLabel = true }: Props) {
  const [ms, setMs] = useState(() => msUntil(target));

  useEffect(() => {
    const id = setInterval(() => setMs(msUntil(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className={`flex items-baseline gap-3 ${className}`}>
      <span className="font-mono font-bold text-[clamp(36px,8vw,56px)] leading-none tracking-tight tabular-nums">
        {fmtCountdownClock(ms)}
      </span>
      {showLabel && (
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
          {ms > 0 ? "até o apito" : "em andamento"}
        </span>
      )}
    </div>
  );
}
