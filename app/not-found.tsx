import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center hexa-container py-12">
      <div className="max-w-md">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-4">
          ↳ 404 · Não encontrado
        </div>
        <h1 className="font-display text-7xl font-extrabold uppercase tracking-tight leading-none">
          Sai <span className="text-acid">de</span> Campo
        </h1>
        <p className="mt-6 text-bone-muted">
          A página não existe ou seu código de bolão tá errado.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-pitch border border-acid text-acid font-display font-extrabold uppercase tracking-wider px-5 py-3 hover:bg-acid hover:text-black transition"
        >
          Voltar pro início →
        </Link>
      </div>
    </main>
  );
}
