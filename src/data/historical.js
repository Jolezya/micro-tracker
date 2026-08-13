// =============================================================================
//  HISTORICAL RESULTS  —  Zambia Presidential Elections
// -----------------------------------------------------------------------------
//  These national figures are REAL historical results (rounded/approximate) and
//  are used only for the historical-comparison feature. They are NOT part of the
//  2026 demo live feed. Provincial 2021 shares live in geography.js (hist2021).
//
//  Sources for the real figures: Electoral Commission of Zambia published
//  results, 2011 / 2015 / 2016 / 2021. Figures are rounded for display.
// =============================================================================

export const HISTORICAL_ELECTIONS = [
  {
    year: 2011,
    turnout: 0.536,
    winner: 'Michael Sata (PF)',
    note: 'PF wins power; three-way race.',
    results: [
      { name: 'Michael Sata', party: 'PF', share: 0.4298, votes: 1_150_045 },
      { name: 'Rupiah Banda', party: 'MMD', share: 0.3611, votes: 966_040 },
      { name: 'Hakainde Hichilema', party: 'UPND', share: 0.1826, votes: 489_004 },
      { name: 'Others', party: 'IND', share: 0.0265, votes: 70_912 }
    ]
  },
  {
    year: 2015,
    turnout: 0.322,
    winner: 'Edgar Lungu (PF)',
    note: 'Presidential by-election after President Sata’s death. Very narrow.',
    results: [
      { name: 'Edgar Lungu', party: 'PF', share: 0.4833, votes: 807_925 },
      { name: 'Hakainde Hichilema', party: 'UPND', share: 0.4667, votes: 780_168 },
      { name: 'Others', party: 'IND', share: 0.0500, votes: 83_600 }
    ]
  },
  {
    year: 2016,
    turnout: 0.565,
    winner: 'Edgar Lungu (PF)',
    note: 'PF retains power above 50% in first round; result disputed by UPND.',
    results: [
      { name: 'Edgar Lungu', party: 'PF', share: 0.5035, votes: 1_860_877 },
      { name: 'Hakainde Hichilema', party: 'UPND', share: 0.4763, votes: 1_760_347 },
      { name: 'Others', party: 'IND', share: 0.0202, votes: 74_500 }
    ]
  },
  {
    year: 2021,
    turnout: 0.709,
    winner: 'Hakainde Hichilema (UPND)',
    note: 'UPND wins decisively; large turnout, big swing from 2016.',
    results: [
      { name: 'Hakainde Hichilema', party: 'UPND', share: 0.5902, votes: 2_852_348 },
      { name: 'Edgar Lungu', party: 'PF', share: 0.3871, votes: 1_870_780 },
      { name: 'Others', party: 'IND', share: 0.0227, votes: 109_600 }
    ]
  }
];

// Placeholder for the live 2026 election — filled from the running projection so
// the historical screen can show 2026 alongside prior cycles.
export const ELECTION_META = {
  year: 2026,
  name: 'Zambia Presidential Election 2026',
  date: '2026-08-13',
  registeredNote: 'Registered-voter totals per province are realistic approximations (DEMO).'
};
