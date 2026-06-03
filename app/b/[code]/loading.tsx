// Skeleton mostrado IMEDIATAMENTE quando o usuário navega entre abas,
// enquanto o server component processa. Mata o "delay percebido".

export default function Loading() {
  return (
    <div className="hexa-container py-6 space-y-6 animate-pulse">
      {/* Top */}
      <div className="flex items-baseline justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-graphite" />
          <div className="h-10 w-48 bg-graphite-2" />
        </div>
      </div>

      {/* 3 blocos de skeleton */}
      <div className="space-y-4">
        <div className="h-24 bg-graphite/60 border border-rule" />
        <div className="h-24 bg-graphite/60 border border-rule" />
        <div className="h-24 bg-graphite/60 border border-rule" />
      </div>

      {/* Indicador discreto de loading */}
      <div className="text-center text-[10px] font-mono uppercase tracking-[0.18em] text-bone-faint pt-6">
        ↳ carregando
      </div>
    </div>
  );
}
