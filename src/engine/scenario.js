// =============================================================================
//  SCENARIO SIMULATOR — assumption overrides
// -----------------------------------------------------------------------------
//  A scenario is a plain object of overrides passed to buildModel(). Nothing is
//  mutated in the store — scenarios are what-ifs layered on top of real counted
//  data (counted votes are always fixed; only the OUTSTANDING vote is re-modelled).
// =============================================================================

import { provinceById, PROVINCES } from '../data/geography.js';
import { candidateName } from '../data/candidates.js';

export function emptyScenario() {
  return {
    provinceRemainingShare: {}, // pid -> {HH,BM,FM,OTH} forced remaining-vote share
    provinceTurnoutMultiplier: {}, // pid -> multiplier on expected turnout
    remainingShareGlobal: null, // {HH,BM,...} forces ALL remaining nationwide
    swingOverride: null
  };
}

export function isScenarioActive(s) {
  if (!s) return false;
  return (
    Object.keys(s.provinceRemainingShare || {}).length > 0 ||
    Object.keys(s.provinceTurnoutMultiplier || {}).length > 0 ||
    !!s.remainingShareGlobal ||
    !!s.swingOverride
  );
}

/** Human-readable list of the active assumptions in a scenario. */
export function describeScenario(s) {
  const out = [];
  if (!s) return out;
  if (s.remainingShareGlobal) {
    const g = s.remainingShareGlobal;
    const top = ['HH', 'BM', 'FM', 'OTH'].sort((a, b) => (g[b] || 0) - (g[a] || 0))[0];
    out.push(`All remaining vote assumed to split with ${candidateName(top)} at ${((g[top] || 0) * 100).toFixed(0)}%.`);
  }
  for (const pid of Object.keys(s.provinceRemainingShare || {})) {
    const g = s.provinceRemainingShare[pid];
    const top = ['HH', 'BM', 'FM', 'OTH'].sort((a, b) => (g[b] || 0) - (g[a] || 0))[0];
    out.push(`${provinceById[pid].name}: remaining vote forced to ${candidateName(top)} ${((g[top] || 0) * 100).toFixed(0)}%.`);
  }
  for (const pid of Object.keys(s.provinceTurnoutMultiplier || {})) {
    const m = s.provinceTurnoutMultiplier[pid];
    out.push(`${provinceById[pid].name}: turnout ${m >= 1 ? '+' : ''}${((m - 1) * 100).toFixed(0)}%.`);
  }
  if (s.swingOverride) out.push('Custom national swing applied.');
  return out;
}

export { PROVINCES };
