// =============================================================================
//  FORECAST MODEL  —  reporting-bias-aware projection
// -----------------------------------------------------------------------------
//  The central rule: DO NOT extrapolate the national reported share to the whole
//  country. Early returns are geographically skewed. Instead we:
//
//   1. Estimate a national swing vs the 2021 prior from the areas that HAVE
//      reported (turnout-weighted).
//   2. Predict the OUTSTANDING vote in every constituency from that
//      constituency's own 2021 pattern + the estimated swing, blended with its
//      own partial count in proportion to how much of it has reported.
//   3. Aggregate counted + predicted-outstanding across all 156-style units,
//      weighting by each unit's expected size.
//
//  Because outstanding PF-stronghold provinces keep their PF-leaning priors, the
//  projection self-corrects for the fact that UPND areas reported first.
// =============================================================================

import { CONSTITUENCIES, constituencyById, provinceById, expectedVotesFor } from '../data/geography.js';
import { clamp } from '../lib/rng.js';

const CIDS = ['HH', 'BM', 'FM', 'OTH'];
const VALID = ['HH', 'BM', 'FM', 'OTH'];

function normalizePos(vec) {
  const out = {};
  let total = 0;
  for (const k of CIDS) {
    out[k] = Math.max(0, vec[k] || 0);
    total += out[k];
  }
  if (total <= 0) return { HH: 0.25, BM: 0.25, FM: 0.25, OTH: 0.25 };
  for (const k of CIDS) out[k] /= total;
  return out;
}

/** Turnout-weighted national swing vs 2021, estimated from reported areas. */
export function estimateSwing(agg) {
  const acc = { HH: 0, BM: 0, FM: 0, OTH: 0 };
  let wsum = 0;
  for (const con of CONSTITUENCIES) {
    const a = agg.byConstituency[con.id];
    if (!a.hasData || a.countedValid <= 0) continue;
    const w = a.countedValid;
    for (const k of CIDS) acc[k] += w * (a.shares[k] - (con.hist2021[k] || 0));
    wsum += w;
  }
  const swing = { HH: 0, BM: 0, FM: 0, OTH: 0 };
  if (wsum > 0) for (const k of CIDS) swing[k] = acc[k] / wsum;
  return swing;
}

/**
 * Build the projection model. This structure is consumed by both the point
 * forecast and the Monte Carlo simulator so they stay perfectly consistent.
 * @param {object} agg       aggregate() output
 * @param {object} scenario  optional overrides (see engine/scenario.js)
 */
export function buildModel(agg, scenario = {}) {
  const reportedFraction = agg.national.pctCounted;
  const invalidRate = agg.national.countedCast > 0
    ? clamp(agg.national.invalid / agg.national.countedCast, 0, 0.05)
    : 0.012;

  const swing = scenario.swingOverride || estimateSwing(agg);

  const units = [];
  for (const con of CONSTITUENCIES) {
    const a = agg.byConstituency[con.id];

    // Expected size, allowing a scenario turnout multiplier per province.
    const turnoutMult = scenario.provinceTurnoutMultiplier?.[con.provinceId] ?? 1;
    let expectedTotal = a.isFinal ? a.countedCast : Math.max(a.countedCast, Math.round(expectedVotesFor(con) * turnoutMult));
    const expectedValid = Math.round(expectedTotal * (1 - invalidRate));
    const countedValid = a.countedValid;
    const outstandingValid = Math.max(0, expectedValid - countedValid);

    // Mean share of the OUTSTANDING vote in this unit.
    let remainingMean;
    if (scenario.remainingShareGlobal) {
      remainingMean = normalizePos(scenario.remainingShareGlobal);
    } else if (scenario.provinceRemainingShare?.[con.provinceId]) {
      remainingMean = normalizePos(scenario.provinceRemainingShare[con.provinceId]);
    } else {
      const prior = normalizePos({
        HH: con.hist2021.HH + swing.HH,
        BM: con.hist2021.BM + swing.BM,
        FM: con.hist2021.FM + swing.FM,
        OTH: con.hist2021.OTH + swing.OTH
      });
      if (a.hasData && a.countedValid > 0) {
        // Blend the unit's own partial pattern with the prior, weighted by how
        // much of the unit has reported.
        const alpha = clamp(a.reportingPct, 0, 1);
        remainingMean = normalizePos({
          HH: alpha * a.shares.HH + (1 - alpha) * prior.HH,
          BM: alpha * a.shares.BM + (1 - alpha) * prior.BM,
          FM: alpha * a.shares.FM + (1 - alpha) * prior.FM,
          OTH: alpha * a.shares.OTH + (1 - alpha) * prior.OTH
        });
      } else {
        remainingMean = prior;
      }
    }

    // Per-unit uncertainty: shrinks as the unit reports; zero once final.
    const noiseSd = a.isFinal ? 0 : clamp(0.05 * (1 - a.reportingPct) + 0.015, 0.01, 0.08);

    units.push({
      constituencyId: con.id,
      provinceId: con.provinceId,
      counted: { ...a.counted },
      countedValid,
      outstandingValid,
      expectedValid,
      remainingMean,
      noiseSd,
      isFinal: a.isFinal
    });
  }

  // National correlated-swing uncertainty: large when little has reported.
  const nationalSwingSd = clamp(0.055 * (1 - reportedFraction) + 0.012, 0.012, 0.06);

  return { units, swing, reportedFraction, invalidRate, nationalSwingSd, scenario };
}

/** Deterministic central projection from the model (no random draws). */
export function pointForecast(model) {
  const totals = { HH: 0, BM: 0, FM: 0, OTH: 0 };
  const byProvince = {};
  const byConstituency = {};
  for (const u of model.units) {
    const v = {};
    for (const k of CIDS) v[k] = u.counted[k] + u.outstandingValid * u.remainingMean[k];
    byConstituency[u.constituencyId] = { votes: v, shares: normalizePos(v) };
    if (!byProvince[u.provinceId]) byProvince[u.provinceId] = { HH: 0, BM: 0, FM: 0, OTH: 0 };
    for (const k of CIDS) {
      totals[k] += v[k];
      byProvince[u.provinceId][k] += v[k];
    }
  }
  const totalValid = VALID.reduce((a, k) => a + totals[k], 0);
  const shares = {};
  for (const k of CIDS) shares[k] = totalValid > 0 ? totals[k] / totalValid : 0;
  const provShares = {};
  for (const pid of Object.keys(byProvince)) provShares[pid] = normalizePos(byProvince[pid]);

  const order = ['HH', 'BM', 'FM', 'OTH'].sort((a, b) => shares[b] - shares[a]);
  return {
    projectedVotes: totals,
    projectedTotalValid: totalValid,
    shares,
    leader: order[0],
    runnerUp: order[1],
    margin: shares[order[0]] - shares[order[1]],
    byProvince: provShares,
    byConstituency,
    order
  };
}

export { normalizePos, CIDS };
