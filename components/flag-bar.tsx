// Cores das bandeiras (representação minimal — barra de 3px no card)

const flagColors: Record<string, string> = {
  BRA: "linear-gradient(90deg, #009B3A 33%, #FFDF00 33% 66%, #002776 66%)",
  ARG: "linear-gradient(90deg, #75AADB 33%, #fff 33% 66%, #75AADB 66%)",
  ESP: "linear-gradient(90deg, #c60b1e 25%, #ffc400 25% 75%, #c60b1e 75%)",
  FRA: "linear-gradient(90deg, #002395 33%, #fff 33% 66%, #ED2939 66%)",
  ENG: "linear-gradient(90deg, #fff 0 100%), #C8102E",
  GER: "linear-gradient(90deg, #000 33%, #DD0000 33% 66%, #FFCE00 66%)",
  ITA: "linear-gradient(90deg, #009246 33%, #fff 33% 66%, #CE2B37 66%)",
  POR: "linear-gradient(90deg, #006600 40%, #FF0000 40%)",
  NED: "linear-gradient(90deg, #fff 0 100%), #AE1C28",
  BEL: "linear-gradient(90deg, #000 33%, #FFC700 33% 66%, #C8102E 66%)",
  CRO: "linear-gradient(90deg, #FF0000 50%, #fff 50%)",
  DEN: "#C8102E",
  NOR: "linear-gradient(90deg, #BA0C2F 0 100%), #00205B",
  AUT: "linear-gradient(90deg, #ED2939 33%, #fff 33% 66%, #ED2939 66%)",
  SUI: "#FF0000",
  TUR: "#E30A17",
  SWE: "#006AA7",
  CZE: "linear-gradient(90deg, #11457E 50%, #D7141A 50%)",
  MAR: "#C1272D",
  SEN: "linear-gradient(90deg, #00853F 33%, #FDEF42 33% 66%, #E31B23 66%)",
  EGY: "linear-gradient(90deg, #CE1126 33%, #fff 33% 66%, #000 66%)",
  NGA: "linear-gradient(90deg, #008751 33%, #fff 33% 66%, #008751 66%)",
  CIV: "linear-gradient(90deg, #F77F00 33%, #fff 33% 66%, #009E60 66%)",
  CMR: "linear-gradient(90deg, #007A5E 33%, #CE1126 33% 66%, #FCD116 66%)",
  GHA: "linear-gradient(90deg, #CE1126 0 100%), #006B3F",
  ALG: "linear-gradient(90deg, #006233 50%, #fff 50%)",
  TUN: "#E70013",
  JPN: "linear-gradient(90deg, #fff 0 100%), #BC002D",
  KOR: "#fff",
  IRN: "linear-gradient(90deg, #239F40 33%, #fff 33% 66%, #DA0000 66%)",
  AUS: "#012169",
  KSA: "#006C35",
  UZB: "linear-gradient(90deg, #1EB53A 0 100%), #0099B5",
  JOR: "linear-gradient(90deg, #000 33%, #fff 33% 66%, #007A3D 66%)",
  IRQ: "linear-gradient(90deg, #CE1126 33%, #fff 33% 66%, #000 66%)",
  MEX: "linear-gradient(90deg, #006847 33%, #fff 33% 66%, #CE1126 66%)",
  USA: "linear-gradient(90deg, #B22234 0 100%), #3C3B6E",
  CAN: "linear-gradient(90deg, #FF0000 25%, #fff 25% 75%, #FF0000 75%)",
  JAM: "linear-gradient(90deg, #009B3A 0 100%), #FED100",
  CRC: "linear-gradient(90deg, #002B7F 0 100%), #CE1126",
  PAN: "linear-gradient(90deg, #fff 50%, #DA121A 50%)",
  HON: "linear-gradient(90deg, #00BCE4 0 100%), #fff",
  HAI: "linear-gradient(90deg, #00209F 50%, #D21034 50%)",
  COL: "linear-gradient(90deg, #FCD116 50%, #003893 50%)",
  URU: "linear-gradient(90deg, #fff 0 100%), #0038A8",
  ECU: "linear-gradient(90deg, #FFD100 50%, #034EA2 50%)",
  PAR: "linear-gradient(90deg, #D52B1E 33%, #fff 33% 66%, #0038A8 66%)",
  NZL: "#012169",
  TBD: "rgba(242, 241, 236, 0.22)",
};

interface Props {
  code: string;
  className?: string;
  height?: number;
}

export function FlagBar({ code, className = "", height = 3 }: Props) {
  const bg = flagColors[code] ?? "rgba(242, 241, 236, 0.32)";
  return (
    <span
      className={`block ${className}`}
      style={{ height, background: bg }}
      aria-hidden
    />
  );
}
