"use client";

import { useActionState } from "react";
import { adminResetMemberPin } from "@/lib/actions/admin";

type R = { ok: true } | { ok: false; error: string };

async function action(_prev: R | null, formData: FormData) {
  return adminResetMemberPin(formData) as Promise<R>;
}

export function AdminResetPinButton({
  memberId,
  hasPin,
}: {
  memberId: string;
  hasPin: boolean;
}) {
  const [state, formAction, pending] = useActionState<R | null, FormData>(action, null);

  if (!hasPin) {
    return (
      <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-bone-faint px-2 py-1">
        sem PIN
      </span>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Resetar o PIN desse membro? Ele vai precisar criar um novo na próxima entrada."
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[9px] font-mono uppercase tracking-[0.14em] text-bone-muted hover:text-acid border border-rule px-2 py-1"
      >
        {pending ? "..." : state && !state.ok ? "Erro" : "Reset PIN"}
      </button>
    </form>
  );
}
