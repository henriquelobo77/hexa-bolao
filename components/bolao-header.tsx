import Link from "next/link";

interface Props {
  bolaoName: string;
  memberNickname: string;
}

export function BolaoHeader({ bolaoName, memberNickname }: Props) {
  const initial = memberNickname.charAt(0).toUpperCase();
  return (
    <header className="hexa-container pt-5 pb-4 border-b border-rule">
      <div className="flex items-center justify-between">
        <Link href="../" className="flex items-end gap-2">
          <span className="font-display text-3xl leading-none tracking-tight">
            HE<span className="text-acid">X</span>A
          </span>
          <span className="hexa-pulse inline-block w-1.5 h-1.5 rounded-full bg-acid mb-1" />
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-bone-muted">
          <span className="hidden md:inline truncate max-w-[180px]">{bolaoName}</span>
          <span className="inline-flex w-6 h-6 rounded-full bg-acid text-black font-display text-sm font-extrabold items-center justify-center">
            {initial}
          </span>
          <span className="text-bone truncate max-w-[100px]">{memberNickname}</span>
        </div>
      </div>
    </header>
  );
}
