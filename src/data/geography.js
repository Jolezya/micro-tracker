// =============================================================================
//  GEOGRAPHY  —  Provinces & Constituencies of Zambia
// -----------------------------------------------------------------------------
//  DEMO DATA — NOT ACTUAL ELECTION RESULTS.
//  Registered-voter totals and 2021 provincial vote shares are realistic
//  approximations used to demonstrate the modelling. `hist2021` shares are keyed
//  by 2026 candidate id via the historicalKey mapping (HH<-UPND, BM<-PF, FM<-SP).
//
//  Map layout is a TILE CARTOGRAM (grid of provinces) — a schematic, not a
//  geographic projection. `grid` gives {col,row} positions loosely mirroring
//  Zambia's real arrangement so leaders/turnout can be read at a glance.
// =============================================================================

import { mulberry32, hashString } from '../lib/rng.js';

/**
 * Province master records.
 * hist2021: 2021 vote shares (sum ~1.0) used as the regional prior.
 * lean: human-readable historical tendency string.
 */
export const PROVINCES = [
  {
    id: 'LSK', name: 'Lusaka', abbr: 'LSK',
    registeredVoters: 1_150_000, expectedTurnout: 0.68,
    hist2021: { HH: 0.63, BM: 0.33, FM: 0.02, OTH: 0.02 },
    lean: 'Urban swing province — leans UPND',
    grid: { col: 3, row: 3 }
  },
  {
    id: 'CB', name: 'Copperbelt', abbr: 'CB',
    registeredVoters: 1_000_000, expectedTurnout: 0.70,
    hist2021: { HH: 0.62, BM: 0.34, FM: 0.02, OTH: 0.02 },
    lean: 'Urban / mining — competitive, leaned UPND 2021',
    grid: { col: 3, row: 1 }
  },
  {
    id: 'EAS', name: 'Eastern', abbr: 'EAS',
    registeredVoters: 850_000, expectedTurnout: 0.72,
    hist2021: { HH: 0.52, BM: 0.45, FM: 0.01, OTH: 0.02 },
    lean: 'Historically PF-leaning, flipped narrowly 2021',
    grid: { col: 5, row: 2 }
  },
  {
    id: 'SOU', name: 'Southern', abbr: 'SOU',
    registeredVoters: 800_000, expectedTurnout: 0.76,
    hist2021: { HH: 0.90, BM: 0.08, FM: 0.01, OTH: 0.01 },
    lean: 'UPND heartland — very strong UPND',
    grid: { col: 2, row: 4 }
  },
  {
    id: 'NOR', name: 'Northern', abbr: 'NOR',
    registeredVoters: 600_000, expectedTurnout: 0.71,
    hist2021: { HH: 0.38, BM: 0.59, FM: 0.01, OTH: 0.02 },
    lean: 'PF stronghold',
    grid: { col: 4, row: 0 }
  },
  {
    id: 'CEN', name: 'Central', abbr: 'CEN',
    registeredVoters: 590_000, expectedTurnout: 0.69,
    hist2021: { HH: 0.60, BM: 0.36, FM: 0.02, OTH: 0.02 },
    lean: 'Competitive — leaned UPND 2021',
    grid: { col: 3, row: 2 }
  },
  {
    id: 'LUA', name: 'Luapula', abbr: 'LUA',
    registeredVoters: 510_000, expectedTurnout: 0.70,
    hist2021: { HH: 0.28, BM: 0.69, FM: 0.01, OTH: 0.02 },
    lean: 'PF stronghold (strongest)',
    grid: { col: 3, row: 0 }
  },
  {
    id: 'MUC', name: 'Muchinga', abbr: 'MUC',
    registeredVoters: 420_000, expectedTurnout: 0.70,
    hist2021: { HH: 0.30, BM: 0.67, FM: 0.01, OTH: 0.02 },
    lean: 'PF stronghold',
    grid: { col: 5, row: 0 }
  },
  {
    id: 'WES', name: 'Western', abbr: 'WES',
    registeredVoters: 420_000, expectedTurnout: 0.66,
    hist2021: { HH: 0.66, BM: 0.30, FM: 0.02, OTH: 0.02 },
    lean: 'Leans UPND',
    grid: { col: 1, row: 4 }
  },
  {
    id: 'NW', name: 'North-Western', abbr: 'NW',
    registeredVoters: 370_000, expectedTurnout: 0.67,
    hist2021: { HH: 0.80, BM: 0.17, FM: 0.01, OTH: 0.02 },
    lean: 'Strong UPND',
    grid: { col: 1, row: 2 }
  }
];

export const provinceById = Object.fromEntries(PROVINCES.map((p) => [p.id, p]));

// -----------------------------------------------------------------------------
//  Constituency names — a curated, representative subset per province.
//  (Zambia has 156 constituencies; this demo models a realistic sample so the
//   province -> constituency drill-down is meaningful without listing all 156.)
// -----------------------------------------------------------------------------
const CONSTITUENCY_NAMES = {
  LSK: ['Lusaka Central', 'Kabwata', 'Matero', 'Munali', 'Mandevu', 'Chawama', 'Kanyama', 'Chilanga', 'Kafue', 'Chongwe'],
  CB: ['Kitwe Central', 'Nkana', 'Wusakile', 'Ndola Central', 'Bwana Mkubwa', 'Chingola', 'Nchanga', 'Mufulira', 'Luanshya', 'Kalulushi'],
  EAS: ['Chipata Central', 'Kasenengwa', 'Petauke Central', 'Msanzala', 'Lundazi', 'Chadiza', 'Katete', 'Sinda', 'Nyimba'],
  SOU: ['Choma Central', 'Mazabuka Central', 'Monze Central', 'Livingstone', 'Pemba', 'Kalomo Central', 'Namwala', 'Gwembe'],
  NOR: ['Kasama Central', 'Malole', 'Chilubi', 'Lupososhi', 'Mbala', 'Senga Hill', 'Mporokoso'],
  CEN: ['Kabwe Central', 'Bwacha', 'Kapiri Mposhi', 'Mkushi North', 'Serenje', 'Mumbwa', 'Chisamba'],
  LUA: ['Mansa Central', 'Bahati', 'Nchelenge', 'Kawambwa', 'Mwense', 'Chienge', 'Samfya'],
  MUC: ['Chinsali', 'Isoka', 'Nakonde', 'Mpika', 'Shiwang’andu', 'Mafinga'],
  WES: ['Mongu Central', 'Senanga', 'Kaoma Central', 'Kalabo Central', 'Sesheke', 'Nalolo', 'Lukulu East'],
  NW: ['Solwezi Central', 'Solwezi East', 'Kasempa', 'Zambezi East', 'Mwinilunga', 'Kabompo', 'Chavuma']
};

/**
 * Build constituency records deterministically. Each province's registered
 * voters are split across its constituencies with a seeded weighting, and each
 * constituency's 2021 shares jitter around the province mean (then renormalise).
 */
function buildConstituencies() {
  const out = [];
  for (const prov of PROVINCES) {
    const names = CONSTITUENCY_NAMES[prov.id];
    const rand = mulberry32(hashString('const-' + prov.id));
    // Raw weights for splitting registered voters.
    const weights = names.map(() => 0.6 + rand() * 0.8);
    const wsum = weights.reduce((a, b) => a + b, 0);
    names.forEach((name, i) => {
      const rv = Math.round((prov.registeredVoters * weights[i]) / wsum);
      // Jitter each candidate share around the province mean.
      const jr = mulberry32(hashString('share-' + prov.id + '-' + name));
      const shares = {};
      let total = 0;
      for (const cid of ['HH', 'BM', 'FM', 'OTH']) {
        const base = prov.hist2021[cid];
        // Larger candidates get proportionally larger swings.
        const jitter = (jr() - 0.5) * 0.12 * Math.max(base, 0.05) * 4;
        const v = Math.max(0.001, base + jitter);
        shares[cid] = v;
        total += v;
      }
      for (const cid of Object.keys(shares)) shares[cid] = shares[cid] / total;
      out.push({
        id: prov.id + '-' + String(i + 1).padStart(2, '0'),
        name,
        provinceId: prov.id,
        registeredVoters: rv,
        expectedTurnout: prov.expectedTurnout + (jr() - 0.5) * 0.08,
        hist2021: shares
      });
    });
  }
  return out;
}

export const CONSTITUENCIES = buildConstituencies();
export const constituencyById = Object.fromEntries(CONSTITUENCIES.map((c) => [c.id, c]));
export const constituenciesByProvince = (pid) => CONSTITUENCIES.filter((c) => c.provinceId === pid);

// National totals (expected).
export const TOTAL_REGISTERED = PROVINCES.reduce((a, p) => a + p.registeredVoters, 0);
export const expectedVotesFor = (entity) => Math.round(entity.registeredVoters * entity.expectedTurnout);
export const TOTAL_EXPECTED_VOTES = CONSTITUENCIES.reduce((a, c) => a + expectedVotesFor(c), 0);
