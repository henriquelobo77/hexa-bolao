// ============================================================
// HEXA · Copa 2026 fixtures (seed data)
// ------------------------------------------------------------
// Times e datas são uma APROXIMAÇÃO do calendário oficial da
// FIFA. Antes de abrir o bolão, peça pro admin conferir e
// ajustar quaisquer diferenças via /admin/jogos.
// ============================================================

export type MatchPhase =
  | "grupos"
  | "r32"
  | "oitavas"
  | "quartas"
  | "semi"
  | "terceiro"
  | "final";

export interface MatchSeed {
  phase: MatchPhase;
  group_letter: string | null;
  round_label: string | null;
  team_home_code: string;
  team_home_name: string;
  team_away_code: string;
  team_away_name: string;
  kickoff_at: string; // ISO, com timezone -03:00 (Brasília)
  venue: string;
  order_index: number;
}

// ------------------------------------------------------------
// Dicionário de seleções
// ------------------------------------------------------------
export const teamNames: Record<string, string> = {
  // Anfitriões
  MEX: "México", USA: "Estados Unidos", CAN: "Canadá",
  // América do Sul
  BRA: "Brasil", ARG: "Argentina", COL: "Colômbia",
  URU: "Uruguai", ECU: "Equador", PAR: "Paraguai",
  // Europa
  FRA: "França", ESP: "Espanha", ENG: "Inglaterra", GER: "Alemanha",
  NED: "Holanda", ITA: "Itália", POR: "Portugal", BEL: "Bélgica",
  CRO: "Croácia", DEN: "Dinamarca", NOR: "Noruega", AUT: "Áustria",
  SUI: "Suíça", TUR: "Turquia", SWE: "Suécia", CZE: "Tchéquia",
  // África
  MAR: "Marrocos", SEN: "Senegal", EGY: "Egito", NGA: "Nigéria",
  CIV: "Costa do Marfim", CMR: "Camarões", GHA: "Gana",
  ALG: "Argélia", TUN: "Tunísia",
  // Ásia
  JPN: "Japão", KOR: "Coreia do Sul", IRN: "Irã", AUS: "Austrália",
  KSA: "Arábia Saudita", UZB: "Uzbequistão", JOR: "Jordânia", IRQ: "Iraque",
  // Oceania
  NZL: "Nova Zelândia",
  // CONCACAF (não anfitriões)
  JAM: "Jamaica", CRC: "Costa Rica", PAN: "Panamá",
  HON: "Honduras", HAI: "Haiti",
  // Placeholder p/ mata-mata (será editado pelo admin)
  TBD: "A definir",
};

export function teamName(code: string): string {
  return teamNames[code] ?? code;
}

// ------------------------------------------------------------
// Grupos (12 × 4)
// A ordem dentro do array define quem é 1, 2, 3, 4 do grupo
// para fins do esquema round-robin abaixo.
// ------------------------------------------------------------
export const groups: Record<string, [string, string, string, string]> = {
  A: ["MEX", "NOR", "KSA", "NZL"],
  B: ["ESP", "EGY", "AUT", "JAM"],
  C: ["ARG", "AUS", "KOR", "JOR"],
  D: ["USA", "IRN", "TUN", "PAR"],
  E: ["FRA", "SEN", "SUI", "UZB"],
  F: ["NED", "CMR", "ECU", "HAI"],
  G: ["BRA", "CRO", "CIV", "NGA"],
  H: ["ENG", "JPN", "ALG", "IRQ"],
  I: ["GER", "POR", "GHA", "PAN"],
  J: ["BEL", "MAR", "SWE", "COL"],
  K: ["ITA", "TUR", "URU", "HON"],
  L: ["CAN", "DEN", "CZE", "CRC"],
};

// ------------------------------------------------------------
// Sedes (rodízio pra ficar realista)
// ------------------------------------------------------------
const venues = [
  "Cidade do México (Azteca)",
  "Toronto (BMO Field)",
  "Nova York (MetLife)",
  "Los Angeles (SoFi)",
  "Dallas (AT&T)",
  "Atlanta (Mercedes-Benz)",
  "Miami (Hard Rock)",
  "Filadélfia (Lincoln)",
  "Boston (Gillette)",
  "Vancouver (BC Place)",
  "Guadalajara (Akron)",
  "Monterrey (BBVA)",
  "Houston (NRG)",
  "Kansas City (Arrowhead)",
  "Seattle (Lumen)",
  "São Francisco (Levi's)",
];

function venueAt(i: number): string {
  return venues[i % venues.length];
}

// ------------------------------------------------------------
// Calendário base (Brasília, UTC-3)
// ------------------------------------------------------------

// Cada grupo joga 6 partidas:
//   R1: 1v2, 3v4
//   R2: 1v3, 2v4
//   R3: 4v1, 2v3
// Vamos distribuir essas partidas em dias e horários realistas.

const KICKOFF_HOURS = ["13:00", "16:00", "19:00", "22:00"]; // BR

function iso(date: string, time: string): string {
  return `${date}T${time}:00-03:00`;
}

// Dias de cada rodada (FIFA 2026 espalha cada rodada por ~7 dias)
const ROUND_1_DAYS = [
  "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14",
  "2026-06-15", "2026-06-16", "2026-06-17",
];
const ROUND_2_DAYS = [
  "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21", "2026-06-22",
];
const ROUND_3_DAYS = [
  "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27",
];

// Em ordem dos grupos (A..L), produz as 6 partidas com datas/horários
function generateGroupMatches(): MatchSeed[] {
  const out: MatchSeed[] = [];
  const groupLetters = Object.keys(groups);
  let orderIndex = 0;
  let venueIdx = 0;

  // Para cada rodada, distribui as 24 partidas (1 partida × 12 grupos × 2 jogos por rodada)
  const rounds: Array<{
    days: string[];
    pairings: [number, number][];
    label: string;
  }> = [
    { days: ROUND_1_DAYS, pairings: [[0, 1], [2, 3]], label: "Rodada 1" },
    { days: ROUND_2_DAYS, pairings: [[0, 2], [1, 3]], label: "Rodada 2" },
    { days: ROUND_3_DAYS, pairings: [[3, 0], [1, 2]], label: "Rodada 3" },
  ];

  rounds.forEach((round) => {
    // 24 partidas dessa rodada, em ordem de grupo
    let slotInRound = 0;
    groupLetters.forEach((letter) => {
      const teams = groups[letter];
      round.pairings.forEach(([homeIdx, awayIdx]) => {
        const day = round.days[slotInRound % round.days.length];
        const hour = KICKOFF_HOURS[Math.floor(slotInRound / round.days.length) % KICKOFF_HOURS.length];
        const home = teams[homeIdx];
        const away = teams[awayIdx];
        out.push({
          phase: "grupos",
          group_letter: letter,
          round_label: `Grupo ${letter} · ${round.label}`,
          team_home_code: home,
          team_home_name: teamName(home),
          team_away_code: away,
          team_away_name: teamName(away),
          kickoff_at: iso(day, hour),
          venue: venueAt(venueIdx++),
          order_index: orderIndex++,
        });
        slotInRound++;
      });
    });
  });

  // Ordena cronologicamente para order_index ficar coerente
  out.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
  out.forEach((m, i) => { m.order_index = i; });
  return out;
}

// ------------------------------------------------------------
// Mata-mata (placeholders — admin completa com os classificados)
// ------------------------------------------------------------
function generateKnockoutMatches(startOrderIndex: number): MatchSeed[] {
  const out: MatchSeed[] = [];
  let order = startOrderIndex;
  let venueIdx = 0;

  // Round of 32 — 16 partidas em ~6 dias
  const r32Days = [
    "2026-06-29", "2026-06-29",
    "2026-06-30", "2026-06-30",
    "2026-07-01", "2026-07-01", "2026-07-01",
    "2026-07-02", "2026-07-02", "2026-07-02",
    "2026-07-03", "2026-07-03", "2026-07-03",
    "2026-06-28", "2026-06-28", "2026-06-28",
  ];
  for (let i = 0; i < 16; i++) {
    out.push({
      phase: "r32",
      group_letter: null,
      round_label: `Round of 32 · Jogo ${i + 1}`,
      team_home_code: "TBD",
      team_home_name: "A definir",
      team_away_code: "TBD",
      team_away_name: "A definir",
      kickoff_at: iso(r32Days[i], KICKOFF_HOURS[i % KICKOFF_HOURS.length]),
      venue: venueAt(venueIdx++),
      order_index: order++,
    });
  }

  // Oitavas — 8 partidas, Jul 4-7
  const oitavasDays = [
    "2026-07-04", "2026-07-04",
    "2026-07-05", "2026-07-05",
    "2026-07-06", "2026-07-06",
    "2026-07-07", "2026-07-07",
  ];
  for (let i = 0; i < 8; i++) {
    out.push({
      phase: "oitavas",
      group_letter: null,
      round_label: `Oitavas de final · Jogo ${i + 1}`,
      team_home_code: "TBD",
      team_home_name: "A definir",
      team_away_code: "TBD",
      team_away_name: "A definir",
      kickoff_at: iso(oitavasDays[i], i % 2 === 0 ? "16:00" : "21:00"),
      venue: venueAt(venueIdx++),
      order_index: order++,
    });
  }

  // Quartas — 4 partidas, Jul 9-11
  const quartasDays = ["2026-07-09", "2026-07-09", "2026-07-10", "2026-07-11"];
  for (let i = 0; i < 4; i++) {
    out.push({
      phase: "quartas",
      group_letter: null,
      round_label: `Quartas de final · Jogo ${i + 1}`,
      team_home_code: "TBD",
      team_home_name: "A definir",
      team_away_code: "TBD",
      team_away_name: "A definir",
      kickoff_at: iso(quartasDays[i], i % 2 === 0 ? "17:00" : "21:00"),
      venue: venueAt(venueIdx++),
      order_index: order++,
    });
  }

  // Semis — 2 partidas, Jul 14-15
  out.push({
    phase: "semi", group_letter: null, round_label: "Semifinal · 1",
    team_home_code: "TBD", team_home_name: "A definir",
    team_away_code: "TBD", team_away_name: "A definir",
    kickoff_at: iso("2026-07-14", "17:00"),
    venue: venueAt(venueIdx++), order_index: order++,
  });
  out.push({
    phase: "semi", group_letter: null, round_label: "Semifinal · 2",
    team_home_code: "TBD", team_home_name: "A definir",
    team_away_code: "TBD", team_away_name: "A definir",
    kickoff_at: iso("2026-07-15", "17:00"),
    venue: venueAt(venueIdx++), order_index: order++,
  });

  // 3º lugar — Jul 18
  out.push({
    phase: "terceiro", group_letter: null, round_label: "Disputa 3º lugar",
    team_home_code: "TBD", team_home_name: "A definir",
    team_away_code: "TBD", team_away_name: "A definir",
    kickoff_at: iso("2026-07-18", "16:00"),
    venue: venueAt(venueIdx++), order_index: order++,
  });

  // Final — Jul 19, MetLife Stadium NJ
  out.push({
    phase: "final", group_letter: null, round_label: "Final",
    team_home_code: "TBD", team_home_name: "A definir",
    team_away_code: "TBD", team_away_name: "A definir",
    kickoff_at: iso("2026-07-19", "17:00"),
    venue: "Nova York (MetLife)", order_index: order++,
  });

  return out;
}

// ------------------------------------------------------------
// Export final
// ------------------------------------------------------------
const groupMatches = generateGroupMatches();
const koMatches = generateKnockoutMatches(groupMatches.length);
export const fixtures: MatchSeed[] = [...groupMatches, ...koMatches];

// Sanity check em dev
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  if (groupMatches.length !== 72) {
    console.warn(`[fixtures] Esperava 72 partidas de grupos, gerou ${groupMatches.length}`);
  }
  if (fixtures.length !== 104) {
    console.warn(`[fixtures] Esperava 104 partidas no total, gerou ${fixtures.length}`);
  }
}
