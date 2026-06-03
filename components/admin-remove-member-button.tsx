"use client";

import { useActionState } from "react";
import { adminRemoveMember } from "@/lib/actions/admin";

type R = { ok: true } | { ok: false; error: string };

async function action(_prev: R | null, formData: FormData) {
  return adminRemoveMember(formData) as Promise<R>;
}

export function AdminRemoveMemberButton({ memberId }: { memberId: string }) {
  const [state, formAction, pending] = useActionState<R | null, FormData>(action, null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Remover esse membro? Os palpites dele também serão removidos.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-warning border border-rule px-2 py-1"
      >
        {pending ? "..." : state && !state.ok ? "Erro" : "Remover"}
      </button>
    </form>
  );
}
