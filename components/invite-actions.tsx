"use client";

import { useState } from "react";

interface Props {
  inviteUrl: string;
  suggestedText: string;
}

export function InviteActions({ inviteUrl, suggestedText }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(suggestedText)}`;

  async function copy(text: string, which: "link" | "text") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }
    } catch {
      // Fallback: noop
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HEXA · Bolão Copa 2026",
          text: suggestedText,
          url: inviteUrl,
        });
      } catch {
        // user cancelou
      }
    } else {
      copy(suggestedText, "text");
    }
  }

  return (
    <section className="space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted">
        ↳ Compartilhar
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => copy(inviteUrl, "link")}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider py-3 hover:bg-acid hover:text-black transition"
        >
          {copiedLink ? "✓ copiado" : "Copiar link"}
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider py-3 text-center hover:bg-acid hover:text-black transition"
        >
          Abrir WhatsApp →
        </a>

        <button
          type="button"
          onClick={share}
          className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider py-3 hover:bg-acid hover:text-black transition"
        >
          Compartilhar...
        </button>
      </div>

      {/* Preview do texto sugerido */}
      <div className="border border-rule">
        <div className="flex items-center justify-between px-3 py-2 border-b border-rule bg-graphite/40">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-bone-muted">
            Texto sugerido
          </div>
          <button
            type="button"
            onClick={() => copy(suggestedText, "text")}
            className="text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-acid"
          >
            {copiedText ? "✓ copiado" : "copiar"}
          </button>
        </div>
        <pre className="p-3 text-sm text-bone-muted whitespace-pre-wrap font-body">
{suggestedText}
        </pre>
      </div>
    </section>
  );
}
