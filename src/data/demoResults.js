// =============================================================================
//  DEMO LIVE RESULTS  —  synthetic election-night snapshot
// -----------------------------------------------------------------------------
//  DEMO DATA — NOT ACTUAL ELECTION RESULTS.
//
//  This generates a realistic *mid-count* picture with three properties the
//  platform is designed to handle correctly:
//
//   1. REPORTING BIAS: urban + UPND-leaning provinces (Lusaka, Copperbelt,
//      Southern) report early; PF strongholds (Northern, Muchinga, Luapula)
//      barely report. A naive extrapolation of the early count therefore
//      OVERSTATES the leader — the forecast engine must correct for this.
//
//   2. A modest national swing vs 2021 (incumbent fatigue) so the race is live.
//
//   3. Planted data-quality problems (turnout >100%, votes > registered, a
//      duplicate/conflict, an unverified social report) to exercise validation.
//
//  Everything here is clearly labelled DEMO throughout the UI.
// =============================================================================

import { CONSTITUENCIES, constituenciesByProvince, PROVINCES, expectedVotesFor } from './geography.js';
import { mulberry32, hashString } from '../lib/rng.js';

// National swing applied to 2021 shares to build the 2026 demo truth.
const SWING_2026 = { HH: -0.06, BM: 0.055, FM: 0.004, OTH: 0.001 };

// Fraction of each province's constituencies that have reported in this snapshot.
const REPORTING_PROPENSITY = {
  LSK: 0.8, CB: 0.8, SOU: 0.85, CEN: 0.6, EAS: 0.5,
  NW: 0.6, WES: 0.5, NOR: 0.25, MUC: 0.2, LUA: 0.2
};

function swungShares(hist) {
  const s = {};
  let total = 0;
  for (const cid of ['HH', 'BM', 'FM', 'OTH']) {
    s[cid] = Math.max(0.002, hist[cid] + SWING_2026[cid]);
    total += s[cid];
  }
  for (const k of Object.keys(s)) s[k] /= total;
  return s;
}

/**
 * @param {number} now  epoch ms used as "current time" so timestamps stagger
 *                       back through the evening.
 * @returns {Array} ingestion inputs for the store.
 */
export function generateDemoResults(now) {
  const inputs = [];
  const reportedConstituencyIds = new Set();

  for (const prov of PROVINCES) {
    const cons = constituenciesByProvince(prov.id);
    const rand = mulberry32(hashString('report-' + prov.id));
    const propensity = REPORTING_PROPENSITY[prov.id] ?? 0.5;

    cons.forEach((c) => {
      if (rand() > propensity) return; // not yet reported
      reportedConstituencyIds.add(c.id);

      const truth = swungShares(c.hist2021);
      const turnoutActual = Math.max(0.4, c.expectedTurnout + (rand() - 0.5) * 0.06);
      const expected = expectedVotesFor(c);

      // 70% of reported constituencies are final; the rest are partial counts.
      const isFinal = rand() > 0.3;
      const fraction = isFinal ? 1 : 0.3 + rand() * 0.5;

      const votesCast = Math.round(c.registeredVoters * turnoutActual * fraction);
      const invalid = Math.round(votesCast * (0.008 + rand() * 0.01));
      const valid = votesCast - invalid;

      const votes = {};
      let assigned = 0;
      for (const cid of ['HH', 'BM', 'FM']) {
        votes[cid] = Math.round(valid * truth[cid]);
        assigned += votes[cid];
      }
      votes.OTH = Math.max(0, valid - assigned); // remainder keeps totals exact

      // Most returns official (ECZ); a minority independently reported by news.
      const isNews = rand() < 0.15;
      inputs.push({
        constituencyId: c.id,
        pollingStation: null,
        sourceId: isNews ? 'NEWS-REUTERS' : 'ECZ',
        votes,
        invalidVotes: invalid,
        registeredVoters: c.registeredVoters,
        final: isFinal,
        receivedAt: now - Math.round(rand() * 6 * 3600 * 1000), // within last 6h
        note: isFinal ? 'Final constituency return' : 'Partial count'
      });
    });
  }

  // ---------------------------------------------------------------------------
  //  Planted data-quality problems (for the validation / integrity demo).
  // ---------------------------------------------------------------------------
  const pickUnreported = (n) => CONSTITUENCIES.filter((c) => !reportedConstituencyIds.has(c.id)).slice(0, n);
  const spare = pickUnreported(4);

  if (spare[0]) {
    // Turnout > 100%: votes cast exceed registered voters.
    const c = spare[0];
    reportedConstituencyIds.add(c.id);
    const rv = c.registeredVoters;
    inputs.push({
      constituencyId: c.id, pollingStation: null, sourceId: 'MANUAL',
      votes: { HH: Math.round(rv * 0.55), BM: Math.round(rv * 0.5), FM: 0, OTH: 0 },
      invalidVotes: 500, registeredVoters: rv, final: true,
      receivedAt: now - 1800 * 1000, note: 'Suspicious: total exceeds register'
    });
  }
  if (spare[1]) {
    // Single candidate exceeds registered voters (impossible total).
    const c = spare[1];
    reportedConstituencyIds.add(c.id);
    inputs.push({
      constituencyId: c.id, pollingStation: null, sourceId: 'CSV',
      votes: { HH: c.registeredVoters + 12000, BM: 4000, FM: 100, OTH: 50 },
      invalidVotes: 200, registeredVoters: c.registeredVoters, final: true,
      receivedAt: now - 2400 * 1000, note: 'Bulk upload — needs review'
    });
  }
  if (spare[2]) {
    // Two conflicting reports for the same constituency (duplicate + conflict).
    const c = spare[2];
    reportedConstituencyIds.add(c.id);
    const rv = c.registeredVoters;
    inputs.push({
      constituencyId: c.id, pollingStation: null, sourceId: 'ECZ',
      votes: { HH: Math.round(rv * 0.34), BM: Math.round(rv * 0.30), FM: Math.round(rv * 0.01), OTH: Math.round(rv * 0.004) },
      invalidVotes: 800, registeredVoters: rv, final: true,
      receivedAt: now - 5400 * 1000, note: 'ECZ return'
    });
    inputs.push({
      constituencyId: c.id, pollingStation: null, sourceId: 'NEWS-LOCAL',
      votes: { HH: Math.round(rv * 0.20), BM: Math.round(rv * 0.44), FM: Math.round(rv * 0.01), OTH: Math.round(rv * 0.004) },
      invalidVotes: 800, registeredVoters: rv, final: true,
      receivedAt: now - 3000 * 1000, note: 'Media tabulation — conflicts with ECZ'
    });
  }
  if (spare[3]) {
    // Unverified social/field report — must never be auto-included in the model.
    const c = spare[3];
    inputs.push({
      constituencyId: c.id, pollingStation: null, sourceId: 'SOCIAL',
      votes: { HH: 9000, BM: 41000, FM: 200, OTH: 100 },
      invalidVotes: 300, registeredVoters: c.registeredVoters, final: false,
      receivedAt: now - 900 * 1000, note: 'Unverified field report — do not trust'
    });
  }

  return inputs;
}

/**
 * Simulate a single plausible FINAL constituency return — used by the
 * "advance count" control to demonstrate live updates. `salt` varies the draw.
 */
export function simulateResult(con, now, salt = 0) {
  const rand = mulberry32(hashString('sim-' + con.id + '-' + salt));
  const truth = swungShares(con.hist2021);
  const turnoutActual = Math.max(0.42, con.expectedTurnout + (rand() - 0.5) * 0.06);
  const votesCast = Math.round(con.registeredVoters * turnoutActual);
  const invalid = Math.round(votesCast * (0.008 + rand() * 0.01));
  const valid = votesCast - invalid;
  const votes = {};
  let assigned = 0;
  for (const cid of ['HH', 'BM', 'FM']) {
    votes[cid] = Math.round(valid * truth[cid]);
    assigned += votes[cid];
  }
  votes.OTH = Math.max(0, valid - assigned);
  return {
    constituencyId: con.id,
    pollingStation: null,
    sourceId: rand() < 0.15 ? 'NEWS-REUTERS' : 'ECZ',
    votes,
    invalidVotes: invalid,
    registeredVoters: con.registeredVoters,
    final: true,
    receivedAt: now,
    note: 'Final constituency return'
  };
}
