"use client";

import { useActionState, useId, useState } from "react";
import { adminSetSpecialResult, adminClearSpecialResult } from "@/lib/actions/admin";

type R = { ok: true } | { ok: false; error: string };
async function setAction(_prev: R | null, formData: FormData) {
  return adminSetSpecialResult(formData) as Promise<R>;
}
async function clearAction(_prev: R | null, formData: FormData) {
  return adminClearSpecialResult(formData) as Promise<R>;
}

interface DatalistEntry {
  value: string;
  hint?: string;
}

interface Props {
  bolaoId: string;
  kind: "campeao" | "artilheiro" | "vice" | "semifinalista";
  label: string;
  position?: number;
  options?: string[];
  datalist?: DatalistEntry[];
  initial?: string;
  freeText?: boolean;
}

export function AdminSpecialResultForm({
  bolaoId, kind, label, position = 1, options, datalist, initial = "", freeText = false,
}: Props) {
  const [state, formAction, pending] = useActionState<R | null, FormData>(setAction, null);
  const [, clearActionFn, clearing] = useActionState<R | null, FormData>(clearAction, null);
  const [value, setValue] = useState(initial);
  const listId = useId();

  const useDatalist = datalist && datalist.length > 0;
  const useSelect = !useDatalist && !freeText && options;

  return (
    <div className="border border-rule p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="font-display text-lg font-bold uppercase tracking-wide">{label}</div>
        {initial && (
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-acid">
            ↳ Atual: {initial}
          </div>
        )}
      </div>
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="bolao_id" value={bolaoId} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="position" value={position} />
        {useDatalist ? (
          <>
            <input
              type="text"
              name="value"
              list={listId}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              className="flex-1 bg-pitch-deep border border-rule px-3 py-2 text-bone focus:border-acid focus:outline-none"
            />
            <datalist id={listId}>
              {datalist!.map((entry) => (
                <option key={entry.value} value={entry.value} label={entry.hint ?? ""} />
              ))}
            </datalist>
          </>
        ) : useSelect ? (
          <select
            name="value"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-pitch-deep border border-rule px-3 py-2 text-bone focus:border-acid focus:outline-none"
          >
            <option value="">Escolher...</option>
            {options!.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="value"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-pitch-deep border border-rule px-3 py-2 text-bone focus:border-acid focus:outline-none"
          />
        )}
        <button
          type="submit"
          disabled={pending || !value}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 hover:bg-acid hover:text-black transition disabled:opacity-40"
        >
          {pending ? "..." : "Salvar"}
        </button>
        {initial && (
          <button
            type="button"
            onClick={() => {
              const fd = new FormData();
              fd.set("bolao_id", bolaoId);
              fd.set("kind", kind);
              fd.set("position", String(position));
              clearActionFn(fd);
              setValue("");
            }}
            disabled={clearing}
            className="border border-rule px-3 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-warning"
          >
            Limpar
          </button>
        )}
      </form>
      {state?.ok && (
        <div className="text-acid text-xs font-mono uppercase tracking-wide">↳ Salvo.</div>
      )}
      {state && !state.ok && (
        <div className="text-warning text-xs font-mono uppercase tracking-wide">
          ↳ {state.error}
        </div>
      )}
    </div>
  );
}
