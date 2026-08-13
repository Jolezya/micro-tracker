// =============================================================================
//  CANDIDATES & PARTIES  —  Zambia Presidential Election 2026
// -----------------------------------------------------------------------------
//  DEMO DATA — NOT ACTUAL ELECTION RESULTS.
//  Candidate slate is illustrative for demonstrating the platform. Party colours
//  are chosen for map legibility, not as official brand colours.
// =============================================================================

export const PARTIES = {
  UPND: { id: 'UPND', name: 'United Party for National Development', color: '#e0245e' },
  PF: { id: 'PF', name: 'Patriotic Front', color: '#2dd4a7' },
  SP: { id: 'SP', name: 'Socialist Party', color: '#f5b301' },
  IND: { id: 'IND', name: 'Independent / Other', color: '#8b93a7' }
};

/**
 * Candidate records. `historicalKey` maps a 2026 candidate to the party whose
 * 2021 provincial result is used as that candidate's regional prior. This is an
 * explicit modelling assumption, surfaced in the methodology docs.
 */
export const CANDIDATES = [
  {
    id: 'HH',
    name: 'Hakainde Hichilema',
    shortName: 'Hichilema',
    party: 'UPND',
    incumbent: true,
    color: PARTIES.UPND.color,
    historicalKey: 'UPND'
  },
  {
    id: 'BM',
    name: 'Brian Mundubile',
    shortName: 'Mundubile',
    party: 'PF',
    incumbent: false,
    color: PARTIES.PF.color,
    historicalKey: 'PF'
  },
  {
    id: 'FM',
    name: 'Fred M’membe',
    shortName: 'M’membe',
    party: 'SP',
    incumbent: false,
    color: PARTIES.SP.color,
    historicalKey: 'SP'
  },
  {
    id: 'OTH',
    name: 'Other candidates (combined)',
    shortName: 'Others',
    party: 'IND',
    incumbent: false,
    color: PARTIES.IND.color,
    historicalKey: 'IND'
  }
];

export const CANDIDATE_IDS = CANDIDATES.map((c) => c.id);
export const MAJOR_CANDIDATE_IDS = ['HH', 'BM', 'FM'];

const byId = Object.fromEntries(CANDIDATES.map((c) => [c.id, c]));
export const candidateById = (id) => byId[id];
export const candidateColor = (id) => (byId[id] ? byId[id].color : '#8b93a7');
export const candidateName = (id) => (byId[id] ? byId[id].shortName : id);

// Zambia presidential rule: a candidate must obtain MORE than 50% of valid
// votes cast to win outright; otherwise the top two proceed to a runoff.
export const WIN_THRESHOLD = 0.5; // strictly greater than 50% (>50%+1 vote)
