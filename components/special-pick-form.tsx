"use client";

import { useActionState, useState } from "react";
import { saveSpecialPick, type PredictResult } from "@/lib/actions/predictions";

async function action(_prev: PredictResult | null, formData: FormData) {
  return saveSpecialPick(formData);
}

interface Option {
  value: string;
  label: string;
}

interface Props {
  kind: "campeao" | "artilheiro" | "vice" | "semifinalista";
  position?: number;
  options?: Option[];
  initial?: string;
  official?: string;
  disabled?: boolean;
  placeholder?: string;
  freeText?: boolean;
}

export function SpecialPickForm({
  kind,
  position = 1,
  options,
  initial = "",
  official,
  disabled = false,
  placeholder,
  freeText = false,
}: Props) {
  const [state, formAction, pending] = useActionState<PredictResult | null, FormData>(
    action,
    null
  );
  const [value, setValue] = useState(initial);

  const isHit = official && value && official.toLowerCase() === value.toLowerCase();
  const isMiss = official && value && official.toLowerCase() !== value.toLowerCase();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="position" value={position} />
      <div className="flex gap-2 items-stretch">
        {freeText || !options ? (
          <input
            type="text"
            name="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-pitch-deep border border-rule px-3 py-3 text-bone focus:border-acid focus:outline-none disabled:opacity-40"
            required
          />
        ) : (
          <select
            name="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            required
            className="flex-1 bg-pitch-deep border border-rule px-3 py-3 text-bone focus:border-acid focus:outline-none disabled:opacity-40"
          >
            <option value="">{placeholder ?? "Escolher..."}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={disabled || pending || !value}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-4 hover:bg-acid hover:text-black transition disabled:opacity-40"
        >
          {pending ? "..." : "OK"}
        </button>
      </div>
      {official && (
        <div
          className={`text-[11px] font-mono uppercase tracking-[0.16em] ${
            isHit ? "text-acid" : isMiss ? "text-warning" : "text-bone-muted"
          }`}
        >
          ↳ Oficial: <span className="font-bold">{official}</span>{" "}
          {isHit ? "· acerto" : isMiss ? "· erro" : ""}
        </div>
      )}
      {state && !state.ok && (
        <div className="text-warning text-[11px] font-mono uppercase tracking-wide">
          ↳ {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="text-acid text-[11px] font-mono uppercase tracking-wide">
          ↳ Salvo.
        </div>
      )}
    </form>
  );
}
