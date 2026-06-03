"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  code: string;
}

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Ícones minimal — line style, 1.5px stroke
const stroke = 1.6;

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12 L12 3 L21 12" />
      <path d="M5 10 V21 H19 V10" />
    </svg>
  );
}

function IconBall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 L15 8 L21 9.5" />
      <path d="M3 9.5 L9 8 L12 3" />
      <path d="M9 8 L7 14 L3 14.5" />
      <path d="M15 8 L17 14 L21 14.5" />
      <path d="M7 14 L12 18 L17 14" />
      <path d="M12 18 L12 21" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="4" width="12" height="18" rx="1.5" />
      <path d="M9 4 V2 H15 V4" />
      <path d="M9 11 L11 13 L15 9" />
      <path d="M9 17 H15" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4 H17 V11 A5 5 0 0 1 7 11 V4 Z" />
      <path d="M7 5 H4 V8 A3 3 0 0 0 7 11" />
      <path d="M17 5 H20 V8 A3 3 0 0 1 17 11" />
      <path d="M10 16 H14" />
      <path d="M12 16 V20" />
      <path d="M9 20 H15" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 L14.5 9 L21 9.5 L16 14 L17.5 21 L12 17.5 L6.5 21 L8 14 L3 9.5 L9.5 9 Z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21" />
    </svg>
  );
}

const items: Item[] = [
  { href: "", label: "Home", icon: <IconHome /> },
  { href: "/jogos", label: "Jogos", icon: <IconBall /> },
  { href: "/palpites", label: "Palpites", icon: <IconClipboard /> },
  { href: "/ranking", label: "Ranking", icon: <IconTrophy /> },
  { href: "/especiais", label: "Especiais", icon: <IconStar /> },
  { href: "/perfil", label: "Perfil", icon: <IconUser /> },
];

export function BolaoNav({ code }: Props) {
  const pathname = usePathname();
  const base = `/b/${code}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-pitch/90 backdrop-blur-md border-t border-rule-strong">
      <div className="max-w-[720px] mx-auto flex items-stretch justify-between">
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
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-[0.08em] relative transition-colors ${
                active ? "text-acid" : "text-bone-muted hover:text-bone"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-acid" />
              )}
              {item.icon}
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area inset pra notch/home indicator do iOS */}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
