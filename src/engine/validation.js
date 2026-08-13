// =============================================================================
//  VALIDATION & DATA-INTEGRITY SCORING
// -----------------------------------------------------------------------------
//  Rules FLAG suspicious data — they never silently delete or "fix" it. Every
//  result gets an integrity score (0–100). Critical flags drop a result out of
//  the model by default, but the data is retained and visible with its reasons.
// =============================================================================

import { constituencyById, provinceById } from '../data/geography.js';
import { MAJOR_CANDIDATE_IDS } from '../data/candidates.js';

export const SEVERITY = { critical: 'critical', warning: 'warning', info: 'info' };
const PENALTY = { critical: 60, warning: 20, info: 8 };

export function validVotesOf(votes) {
  return ['HH', 'BM', 'FM', 'OTH'].reduce((a, k) => a + (Number(votes[k]) || 0), 0);
}

/**
 * Validate a single result against the currently-active result set.
 * @returns {{flags: Array<{code,severity,message}>, integrityScore: number, votesCast:number, turnout:number}}
 */
export function validateResult(rec, activeResults = []) {
  const flags = [];
  const votes = rec.votes || {};
  const registered = Number(rec.registeredVoters) || 0;
  const invalid = Number(rec.invalidVotes) || 0;
  const valid = validVotesOf(votes);
  const votesCast = valid + invalid;
  const turnout = registered > 0 ? votesCast / registered : 0;

  const con = constituencyById[rec.constituencyId];
  const prov = con ? provinceById[con.provinceId] : null;

  const add = (code, severity, message) => flags.push({ code, severity, message });

  // --- Impossible / structural errors -------------------------------------
  const anyNegative = ['HH', 'BM', 'FM', 'OTH'].some((k) => Number(votes[k]) < 0) || invalid < 0;
  if (anyNegative) add('negative_values', SEVERITY.critical, 'Negative vote or invalid-ballot count.');

  if (registered <= 0) add('missing_register', SEVERITY.warning, 'Registered-voter total is missing or zero.');

  if (registered > 0 && votesCast > registered) {
    add('exceeds_register', SEVERITY.critical,
      `Votes cast (${votesCast.toLocaleString()}) exceed registered voters (${registered.toLocaleString()}).`);
  }
  if (registered > 0 && turnout > 1.0) {
    add('turnout_over_100', SEVERITY.critical, `Turnout ${(turnout * 100).toFixed(1)}% exceeds 100%.`);
  }
  for (const cid of MAJOR_CANDIDATE_IDS) {
    if (registered > 0 && Number(votes[cid]) > registered) {
      add('candidate_over_register', SEVERITY.critical,
        `A single candidate's votes exceed registered voters — impossible total.`);
      break;
    }
  }

  // --- Completeness --------------------------------------------------------
  if (valid > 0) {
    for (const cid of MAJOR_CANDIDATE_IDS) {
      if (!(cid in votes) || votes[cid] === '' || votes[cid] === null || votes[cid] === undefined) {
        add('missing_candidate', SEVERITY.warning, `Major candidate ${cid} missing from this return.`);
      }
    }
  }

  // --- Anomalous vs historical pattern ------------------------------------
  if (con && valid > 0) {
    const leadShare = Math.max(...MAJOR_CANDIDATE_IDS.map((c) => (votes[c] || 0) / valid));
    if (leadShare > 0.985) {
      add('near_unanimous', SEVERITY.warning, `Leading candidate has ${(leadShare * 100).toFixed(1)}% — near-unanimous, verify.`);
    }
    // Deviation from the province's 2021 prior.
    if (prov) {
      let maxDev = 0;
      for (const cid of MAJOR_CANDIDATE_IDS) {
        const share = (votes[cid] || 0) / valid;
        maxDev = Math.max(maxDev, Math.abs(share - (prov.hist2021[cid] || 0)));
      }
      if (maxDev > 0.45) {
        add('large_swing', SEVERITY.warning,
          `Result swings ${(maxDev * 100).toFixed(0)}pts from the province's 2021 pattern — anomalous.`);
      }
    }
  }

  // --- Duplicates & conflicts vs existing active results -------------------
  const sameEntity = activeResults.filter(
    (r) => r.id !== rec.id && r.constituencyId === rec.constituencyId && (r.pollingStation || null) === (rec.pollingStation || null)
  );
  for (const other of sameEntity) {
    if (other.sourceId === rec.sourceId) {
      add('duplicate', SEVERITY.warning, `Duplicate ${rec.pollingStation ? 'polling-station' : 'constituency'} result from the same source (${rec.sourceId}).`);
    }
    const oValid = validVotesOf(other.votes);
    if (oValid > 0 && valid > 0) {
      const leadA = MAJOR_CANDIDATE_IDS.reduce((b, c) => ((votes[c] || 0) > (votes[b] || 0) ? c : b), 'HH');
      const leadB = MAJOR_CANDIDATE_IDS.reduce((b, c) => ((other.votes[c] || 0) > (other.votes[b] || 0) ? c : b), 'HH');
      if (leadA !== leadB) {
        add('conflict', SEVERITY.warning, `Conflicts with another source (${other.sourceId}) — different leading candidate.`);
      }
    }
    // Identical vote tuple as another result -> suspicious.
    if (MAJOR_CANDIDATE_IDS.every((c) => (votes[c] || 0) === (other.votes[c] || 0)) && valid > 0) {
      add('identical_pattern', SEVERITY.warning, `Vote pattern is identical to another result — possible copy/paste error.`);
    }
  }

  // --- Score ---------------------------------------------------------------
  let score = 100;
  for (const f of flags) score -= PENALTY[f.severity] || 0;
  score = Math.max(0, Math.min(100, score));

  return { flags, integrityScore: Math.round(score), votesCast, turnout };
}

export function hasCritical(flags) {
  return flags.some((f) => f.severity === SEVERITY.critical);
}
