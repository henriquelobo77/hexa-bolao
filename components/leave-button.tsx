"use client";

import { leaveBolao } from "@/lib/actions/member";

export function LeaveButton() {
  return (
    <form
      action={leaveBolao}
      onSubmit={(e) => {
        if (
          !confirm(
            "Sair do bolão? Seus palpites ficam salvos, mas você precisa do código pra voltar."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="border border-rule text-bone-muted hover:text-warning hover:border-warning font-mono text-xs uppercase tracking-[0.16em] px-4 py-2 transition"
      >
        Sair do bolão →
      </button>
    </form>
  );
}
