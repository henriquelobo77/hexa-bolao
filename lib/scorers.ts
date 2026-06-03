// ============================================================
// HEXA · Artilheiros prováveis Copa 2026
// ------------------------------------------------------------
// Lista curada dos atacantes mais cotados pra serem artilheiro
// da Copa 2026, agrupados por seleção (código FIFA).
//
// Não é exaustiva — o usuário pode digitar "Outro nome" se a
// pessoa não estiver. O admin faz a conferência manual depois.
// ============================================================

export interface Scorer {
  name: string;
  team: string; // código FIFA (3 letras)
}

export const scorers: Scorer[] = [
  // BRA
  { name: "Vinícius Jr.", team: "BRA" },
  { name: "Endrick", team: "BRA" },
  { name: "Rodrygo", team: "BRA" },
  { name: "Raphinha", team: "BRA" },
  { name: "Richarlison", team: "BRA" },
  { name: "Gabriel Jesus", team: "BRA" },
  { name: "Neymar", team: "BRA" },
  { name: "Pedro", team: "BRA" },
  { name: "Estêvão", team: "BRA" },

  // ARG
  { name: "Lionel Messi", team: "ARG" },
  { name: "Julián Álvarez", team: "ARG" },
  { name: "Lautaro Martínez", team: "ARG" },
  { name: "Ángel Di María", team: "ARG" },
  { name: "Nicolás González", team: "ARG" },
  { name: "Alejandro Garnacho", team: "ARG" },

  // FRA
  { name: "Kylian Mbappé", team: "FRA" },
  { name: "Ousmane Dembélé", team: "FRA" },
  { name: "Marcus Thuram", team: "FRA" },
  { name: "Bradley Barcola", team: "FRA" },
  { name: "Michael Olise", team: "FRA" },
  { name: "Randal Kolo Muani", team: "FRA" },
  { name: "Antoine Griezmann", team: "FRA" },

  // ENG
  { name: "Harry Kane", team: "ENG" },
  { name: "Jude Bellingham", team: "ENG" },
  { name: "Bukayo Saka", team: "ENG" },
  { name: "Phil Foden", team: "ENG" },
  { name: "Cole Palmer", team: "ENG" },
  { name: "Ollie Watkins", team: "ENG" },
  { name: "Anthony Gordon", team: "ENG" },

  // ESP
  { name: "Lamine Yamal", team: "ESP" },
  { name: "Nico Williams", team: "ESP" },
  { name: "Álvaro Morata", team: "ESP" },
  { name: "Dani Olmo", team: "ESP" },
  { name: "Mikel Oyarzabal", team: "ESP" },
  { name: "Ferran Torres", team: "ESP" },

  // POR
  { name: "Cristiano Ronaldo", team: "POR" },
  { name: "Bruno Fernandes", team: "POR" },
  { name: "Bernardo Silva", team: "POR" },
  { name: "Diogo Jota", team: "POR" },
  { name: "João Félix", team: "POR" },
  { name: "Rafael Leão", team: "POR" },
  { name: "Gonçalo Ramos", team: "POR" },

  // GER
  { name: "Florian Wirtz", team: "GER" },
  { name: "Jamal Musiala", team: "GER" },
  { name: "Kai Havertz", team: "GER" },
  { name: "Niclas Füllkrug", team: "GER" },
  { name: "Leroy Sané", team: "GER" },
  { name: "Serge Gnabry", team: "GER" },
  { name: "Maximilian Beier", team: "GER" },

  // NED
  { name: "Memphis Depay", team: "NED" },
  { name: "Cody Gakpo", team: "NED" },
  { name: "Donyell Malen", team: "NED" },
  { name: "Wout Weghorst", team: "NED" },
  { name: "Brian Brobbey", team: "NED" },

  // ITA
  { name: "Gianluca Scamacca", team: "ITA" },
  { name: "Mateo Retegui", team: "ITA" },
  { name: "Federico Chiesa", team: "ITA" },
  { name: "Mattia Zaccagni", team: "ITA" },
  { name: "Giacomo Raspadori", team: "ITA" },

  // BEL
  { name: "Romelu Lukaku", team: "BEL" },
  { name: "Jérémy Doku", team: "BEL" },
  { name: "Leandro Trossard", team: "BEL" },
  { name: "Charles De Ketelaere", team: "BEL" },
  { name: "Kevin De Bruyne", team: "BEL" },

  // CRO
  { name: "Bruno Petković", team: "CRO" },
  { name: "Andrej Kramarić", team: "CRO" },
  { name: "Mario Pašalić", team: "CRO" },
  { name: "Ante Budimir", team: "CRO" },

  // DEN
  { name: "Rasmus Højlund", team: "DEN" },
  { name: "Christian Eriksen", team: "DEN" },
  { name: "Jonas Wind", team: "DEN" },
  { name: "Mikkel Damsgaard", team: "DEN" },

  // NOR
  { name: "Erling Haaland", team: "NOR" },
  { name: "Alexander Sørloth", team: "NOR" },
  { name: "Martin Ødegaard", team: "NOR" },

  // AUT
  { name: "Marcel Sabitzer", team: "AUT" },
  { name: "Marko Arnautović", team: "AUT" },
  { name: "Michael Gregoritsch", team: "AUT" },

  // SUI
  { name: "Granit Xhaka", team: "SUI" },
  { name: "Breel Embolo", team: "SUI" },
  { name: "Zeki Amdouni", team: "SUI" },

  // TUR
  { name: "Arda Güler", team: "TUR" },
  { name: "Kenan Yıldız", team: "TUR" },
  { name: "Hakan Çalhanoğlu", team: "TUR" },

  // SWE
  { name: "Alexander Isak", team: "SWE" },
  { name: "Viktor Gyökeres", team: "SWE" },
  { name: "Anthony Elanga", team: "SWE" },

  // CZE
  { name: "Patrik Schick", team: "CZE" },
  { name: "Adam Hložek", team: "CZE" },

  // MAR
  { name: "Achraf Hakimi", team: "MAR" },
  { name: "Hakim Ziyech", team: "MAR" },
  { name: "Youssef En-Nesyri", team: "MAR" },
  { name: "Brahim Díaz", team: "MAR" },
  { name: "Bilal El Khannouss", team: "MAR" },

  // SEN
  { name: "Sadio Mané", team: "SEN" },
  { name: "Iliman Ndiaye", team: "SEN" },
  { name: "Ismaïla Sarr", team: "SEN" },
  { name: "Boulaye Dia", team: "SEN" },

  // EGY
  { name: "Mohamed Salah", team: "EGY" },
  { name: "Mostafa Mohamed", team: "EGY" },
  { name: "Trezeguet", team: "EGY" },

  // NGA
  { name: "Victor Osimhen", team: "NGA" },
  { name: "Ademola Lookman", team: "NGA" },
  { name: "Samuel Chukwueze", team: "NGA" },
  { name: "Victor Boniface", team: "NGA" },

  // CIV
  { name: "Sébastien Haller", team: "CIV" },
  { name: "Nicolas Pépé", team: "CIV" },
  { name: "Jérémie Boga", team: "CIV" },
  { name: "Simon Adingra", team: "CIV" },

  // CMR
  { name: "Vincent Aboubakar", team: "CMR" },
  { name: "Bryan Mbeumo", team: "CMR" },
  { name: "Karl Toko Ekambi", team: "CMR" },

  // GHA
  { name: "Mohammed Kudus", team: "GHA" },
  { name: "Inaki Williams", team: "GHA" },
  { name: "Antoine Semenyo", team: "GHA" },

  // ALG
  { name: "Riyad Mahrez", team: "ALG" },
  { name: "Islam Slimani", team: "ALG" },
  { name: "Baghdad Bounedjah", team: "ALG" },

  // TUN
  { name: "Wahbi Khazri", team: "TUN" },
  { name: "Naïm Sliti", team: "TUN" },

  // JPN
  { name: "Kaoru Mitoma", team: "JPN" },
  { name: "Takefusa Kubo", team: "JPN" },
  { name: "Ayase Ueda", team: "JPN" },
  { name: "Takuma Asano", team: "JPN" },
  { name: "Daichi Kamada", team: "JPN" },

  // KOR
  { name: "Son Heung-min", team: "KOR" },
  { name: "Lee Kang-in", team: "KOR" },
  { name: "Hwang Hee-chan", team: "KOR" },
  { name: "Cho Gue-sung", team: "KOR" },

  // IRN
  { name: "Mehdi Taremi", team: "IRN" },
  { name: "Sardar Azmoun", team: "IRN" },
  { name: "Alireza Jahanbakhsh", team: "IRN" },

  // AUS
  { name: "Mathew Leckie", team: "AUS" },
  { name: "Mitchell Duke", team: "AUS" },
  { name: "Riley McGree", team: "AUS" },

  // KSA
  { name: "Salem Al-Dawsari", team: "KSA" },
  { name: "Saleh Al-Shehri", team: "KSA" },
  { name: "Firas Al-Buraikan", team: "KSA" },

  // UZB
  { name: "Eldor Shomurodov", team: "UZB" },
  { name: "Abbosbek Fayzullaev", team: "UZB" },

  // JOR
  { name: "Mousa Tamari", team: "JOR" },
  { name: "Yazan Al-Naimat", team: "JOR" },

  // IRQ
  { name: "Aymen Hussein", team: "IRQ" },
  { name: "Ali Al-Hamadi", team: "IRQ" },

  // MEX
  { name: "Henry Martín", team: "MEX" },
  { name: "Santiago Giménez", team: "MEX" },
  { name: "Hirving Lozano", team: "MEX" },
  { name: "Raúl Jiménez", team: "MEX" },
  { name: "Alexis Vega", team: "MEX" },

  // USA
  { name: "Christian Pulisic", team: "USA" },
  { name: "Folarin Balogun", team: "USA" },
  { name: "Giovanni Reyna", team: "USA" },
  { name: "Ricardo Pepi", team: "USA" },
  { name: "Tim Weah", team: "USA" },
  { name: "Brenden Aaronson", team: "USA" },

  // CAN
  { name: "Jonathan David", team: "CAN" },
  { name: "Alphonso Davies", team: "CAN" },
  { name: "Tajon Buchanan", team: "CAN" },
  { name: "Cyle Larin", team: "CAN" },

  // JAM
  { name: "Leon Bailey", team: "JAM" },
  { name: "Michail Antonio", team: "JAM" },
  { name: "Shamar Nicholson", team: "JAM" },

  // CRC
  { name: "Joel Campbell", team: "CRC" },
  { name: "Manfred Ugalde", team: "CRC" },

  // PAN
  { name: "Ismael Díaz", team: "PAN" },
  { name: "Cecilio Waterman", team: "PAN" },

  // HON
  { name: "Antony Lozano", team: "HON" },
  { name: "Romell Quioto", team: "HON" },

  // HAI
  { name: "Duckens Nazon", team: "HAI" },
  { name: "Frantzdy Pierrot", team: "HAI" },

  // COL
  { name: "Luis Díaz", team: "COL" },
  { name: "James Rodríguez", team: "COL" },
  { name: "Jhon Durán", team: "COL" },
  { name: "Rafael Santos Borré", team: "COL" },
  { name: "Jhon Córdoba", team: "COL" },

  // URU
  { name: "Darwin Núñez", team: "URU" },
  { name: "Federico Valverde", team: "URU" },
  { name: "Maxi Araújo", team: "URU" },
  { name: "Facundo Pellistri", team: "URU" },
  { name: "Luis Suárez", team: "URU" },

  // ECU
  { name: "Enner Valencia", team: "ECU" },
  { name: "Kendry Páez", team: "ECU" },
  { name: "Gonzalo Plata", team: "ECU" },

  // PAR
  { name: "Miguel Almirón", team: "PAR" },
  { name: "Antonio Sanabria", team: "PAR" },
  { name: "Julio Enciso", team: "PAR" },

  // NZL
  { name: "Chris Wood", team: "NZL" },
  { name: "Liberato Cacace", team: "NZL" },
];

// Helper de busca case-insensitive sem acentos
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function searchScorers(query: string, limit = 30): Scorer[] {
  if (!query.trim()) return scorers.slice(0, limit);
  const q = normalize(query);
  const hits = scorers.filter((s) => normalize(s.name).includes(q));
  return hits.slice(0, limit);
}
