"use client";

import { useState } from "react";

export function RecapActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      copy();
    }
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <button
        type="button"
        onClick={copy}
        className="bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider py-3 hover:bg-acid hover:text-black transition"
      >
        {copied ? "✓ copiado" : "Copiar texto"}
      </button>
      <a
        href={waUrl}
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
    </section>
  );
}
