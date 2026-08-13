// =============================================================================
//  MONTE CARLO SIMULATION
// -----------------------------------------------------------------------------
//  Estimates each candidate's probability of winning and credible intervals for
//  the final vote share. Uncertainty has two components:
//
//   * a CORRELATED national swing draw (the dominant source of uncertainty when
//     little has reported — the whole outstanding map can move together), and
//   * INDEPENDENT per-unit noise (local variation).
//
//  Final counted results contribute zero uncertainty. Runs are SEEDED, so the
//  same model + seed + iteration count always yields identical probabilities.
// =============================================================================

import { mulberry32, randNormal } from '../lib/rng.js';
import { normalizePos, CIDS } from './forecast.js';
import { WIN_THRESHOLD } from '../data/candidates.js';

const VALID = ['HH', 'BM', 'FM', 'OTH'];

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0;
  const idx = clampIndex((p / 100) * (sortedAsc.length - 1), sortedAsc.length);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}
const clampIndex = (i, n) => Math.max(0, Math.min(n - 1, i));

/**
 * @param {object} model  buildModel() output
 * @param {object} opts    { iterations=5000, seed=12345 }
 */
export function runMonteCarlo(model, opts = {}) {
  const iterations = opts.iterations || 5000;
  const rand = mulberry32(opts.seed || 12345);

  const shareSamples = { HH: [], BM: [], FM: [], OTH: [] };
  const winCount = { HH: 0, BM: 0, FM: 0, OTH: 0 };
  const top2Count = { HH: 0, BM: 0, FM: 0, OTH: 0 };
  let runoffCount = 0;

  for (let it = 0; it < iterations; it++) {
    // One correlated national swing per simulation (HH<->BM axis).
    const nat = randNormal(rand, 0, model.nationalSwingSd);
    const totals = { HH: 0, BM: 0, FM: 0, OTH: 0 };

    for (const u of model.units) {
      if (u.outstandingValid <= 0) {
        for (const k of CIDS) totals[k] += u.counted[k];
        continue;
      }
      const eps = u.noiseSd > 0 ? randNormal(rand, 0, u.noiseSd) : 0;
      const shift = nat + eps; // positive shift favours BM over HH
      const fmNoise = u.noiseSd > 0 ? randNormal(rand, 0, u.noiseSd * 0.4) : 0;
      const rShare = normalizePos({
        HH: u.remainingMean.HH - shift,
        BM: u.remainingMean.BM + shift,
        FM: u.remainingMean.FM + fmNoise,
        OTH: u.remainingMean.OTH
      });
      for (const k of CIDS) totals[k] += u.counted[k] + u.outstandingValid * rShare[k];
    }

    const totalValid = VALID.reduce((a, k) => a + totals[k], 0);
    if (totalValid <= 0) continue;
    const shares = {};
    for (const k of CIDS) {
      shares[k] = totals[k] / totalValid;
      shareSamples[k].push(shares[k]);
    }
    const order = VALID.slice().sort((a, b) => shares[b] - shares[a]);
    top2Count[order[0]] += 1;
    top2Count[order[1]] += 1;
    if (shares[order[0]] > WIN_THRESHOLD) winCount[order[0]] += 1;
    else runoffCount += 1;
  }

  const n = Math.max(1, iterations);
  const summary = {};
  for (const k of CIDS) {
    const s = shareSamples[k].slice().sort((a, b) => a - b);
    summary[k] = {
      mean: s.reduce((a, b) => a + b, 0) / Math.max(1, s.length),
      winProb: winCount[k] / n,
      top2Prob: top2Count[k] / n,
      ci50: [percentile(s, 25), percentile(s, 75)],
      ci80: [percentile(s, 10), percentile(s, 90)],
      ci95: [percentile(s, 2.5), percentile(s, 97.5)],
      median: percentile(s, 50)
    };
  }

  return {
    iterations,
    seed: opts.seed || 12345,
    perCandidate: summary,
    runoffProb: runoffCount / n,
    outrightProb: 1 - runoffCount / n
  };
}
