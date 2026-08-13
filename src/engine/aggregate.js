// =============================================================================
//  AGGREGATION  —  turn the result set into a live tally
// -----------------------------------------------------------------------------
//  Pure functions. Only results that are ACTIVE and INCLUDED-IN-MODEL are
//  counted, keeping unverified/flagged data strictly out of the tally while
//  leaving it visible elsewhere. Produces constituency, province and national
//  roll-ups plus outstanding-vote estimates used by the forecast.
// =============================================================================

import { CONSTITUENCIES, PROVINCES, constituencyById, provinceById, expectedVotesFor } from '../data/geography.js';

const CIDS = ['HH', 'BM', 'FM', 'OTH'];
const zero = () => ({ HH: 0, BM: 0, FM: 0, OTH: 0 });
const sumValid = (v) => CIDS.reduce((a, k) => a + (v[k] || 0), 0);
const leaderOf = (v) => ['HH', 'BM', 'FM'].reduce((b, c) => ((v[c] || 0) > (v[b] || 0) ? c : b), 'HH');

/**
 * @param {Array} results  full results array (we filter to active+included)
 * @returns aggregate snapshot
 */
export function aggregate(results) {
  const included = results.filter((r) => r.status === 'active' && r.includedInModel);

  // ---- constituency roll-up ----
  const byConstituency = {};
  for (const con of CONSTITUENCIES) {
    byConstituency[con.id] = {
      constituencyId: con.id,
      provinceId: con.provinceId,
      counted: zero(),
      invalid: 0,
      isFinal: false,
      hasData: false,
      registeredVoters: con.registeredVoters,
      expectedVotes: expectedVotesFor(con)
    };
  }
  for (const r of included) {
    const agg = byConstituency[r.constituencyId];
    if (!agg) continue;
    for (const k of CIDS) agg.counted[k] += r.votes[k] || 0;
    agg.invalid += r.invalidVotes || 0;
    agg.hasData = true;
    if (r.final) agg.isFinal = true;
  }

  // finalise each constituency's expected / outstanding
  for (const cid of Object.keys(byConstituency)) {
    const a = byConstituency[cid];
    a.countedValid = sumValid(a.counted);
    a.countedCast = a.countedValid + a.invalid;
    a.leader = a.hasData ? leaderOf(a.counted) : null;
    if (a.isFinal) {
      a.expectedTotal = a.countedCast;
      a.outstanding = 0;
      a.reportingPct = 1;
    } else {
      a.expectedTotal = Math.max(a.countedCast, a.expectedVotes);
      a.outstanding = Math.max(0, a.expectedTotal - a.countedCast);
      a.reportingPct = a.expectedTotal > 0 ? a.countedCast / a.expectedTotal : 0;
    }
    a.shares = {};
    for (const k of CIDS) a.shares[k] = a.countedValid > 0 ? a.counted[k] / a.countedValid : 0;
  }

  // ---- province roll-up ----
  const byProvince = {};
  for (const p of PROVINCES) {
    byProvince[p.id] = {
      provinceId: p.id, counted: zero(), invalid: 0, countedCast: 0,
      expectedTotal: 0, outstanding: 0, constituenciesReported: 0,
      constituenciesTotal: 0, registeredVoters: p.registeredVoters
    };
  }
  for (const con of CONSTITUENCIES) {
    const a = byConstituency[con.id];
    const p = byProvince[con.provinceId];
    p.constituenciesTotal += 1;
    if (a.hasData) p.constituenciesReported += 1;
    for (const k of CIDS) p.counted[k] += a.counted[k];
    p.invalid += a.invalid;
    p.countedCast += a.countedCast;
    p.expectedTotal += a.expectedTotal;
    p.outstanding += a.outstanding;
  }
  for (const pid of Object.keys(byProvince)) {
    const p = byProvince[pid];
    p.countedValid = sumValid(p.counted);
    p.leader = p.countedValid > 0 ? leaderOf(p.counted) : null;
    p.reportingPct = p.expectedTotal > 0 ? p.countedCast / p.expectedTotal : 0;
    p.shares = {};
    for (const k of CIDS) p.shares[k] = p.countedValid > 0 ? p.counted[k] / p.countedValid : 0;
  }

  // ---- national roll-up ----
  const counted = zero();
  let invalid = 0;
  let expectedTotal = 0;
  let outstanding = 0;
  let constituenciesReported = 0;
  for (const con of CONSTITUENCIES) {
    const a = byConstituency[con.id];
    for (const k of CIDS) counted[k] += a.counted[k];
    invalid += a.invalid;
    expectedTotal += a.expectedTotal;
    outstanding += a.outstanding;
    if (a.hasData) constituenciesReported += 1;
  }
  const countedValid = sumValid(counted);
  const countedCast = countedValid + invalid;
  const shares = {};
  for (const k of CIDS) shares[k] = countedValid > 0 ? counted[k] / countedValid : 0;

  const national = {
    counted,
    invalid,
    countedValid,
    countedCast,
    expectedTotal,
    outstanding,
    shares,
    leader: countedValid > 0 ? leaderOf(counted) : null,
    constituenciesReported,
    constituenciesTotal: CONSTITUENCIES.length,
    pctCounted: expectedTotal > 0 ? countedCast / expectedTotal : 0
  };

  return { byConstituency, byProvince, national, includedCount: included.length };
}

/** Constituencies that have not reported, grouped by province, with expected votes. */
export function outstandingAreas(agg) {
  const areas = [];
  for (const con of CONSTITUENCIES) {
    const a = agg.byConstituency[con.id];
    if (a.outstanding > 500) {
      areas.push({
        constituencyId: con.id,
        name: con.name,
        provinceId: con.provinceId,
        provinceName: provinceById[con.provinceId].name,
        outstanding: a.outstanding,
        reportingPct: a.reportingPct,
        hasData: a.hasData
      });
    }
  }
  return areas.sort((x, y) => y.outstanding - x.outstanding);
}

export { CIDS };
