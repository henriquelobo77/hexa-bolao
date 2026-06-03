"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  code: string;
}

const items = [
  { href: "", label: "Home" },
  { href: "/jogos", label: "Jogos" },
  { href: "/palpites", label: "Palpites" },
  { href: "/ranking", label: "Ranking" },
  { href: "/especiais", label: "Especiais" },
  { href: "/perfil", label: "Perfil" },
];

export function BolaoNav({ code }: Props) {
  const pathname = usePathname();
  const base = `/b/${code}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-pitch/85 backdrop-blur-md border-t border-rule">
      <div className="hexa-container flex items-stretch justify-between py-2">
        {items.map((item) => {
          const href = base + item.href;
          const active =
            item.href === ""
              ? pathname === base
              : pathname?.startsWith(href);
          return (
            <Link
              key={item.label}
              href={href}
              className={`flex-1 flex items-center justify-center py-3 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.12em] md:tracking-[0.16em] transition-colors ${
                active ? "text-acid" : "text-bone-muted hover:text-bone"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
