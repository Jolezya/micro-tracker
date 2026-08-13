// =============================================================================
//  RUNOFF DETECTION & THRESHOLD MATHEMATICS
// -----------------------------------------------------------------------------
//  Zambia rule: a candidate needs MORE than 50% of valid votes to win in the
//  first round, otherwise the top two go to a runoff.
//
//  "Confirmed" language is used ONLY when the arithmetic genuinely supports it:
//   * MATHEMATICALLY CONFIRMED  — leader already holds >50% of the maximum
//     possible final valid vote (cannot drop below 50% no matter the remainder).
//   * PROJECTED WINNER          — leader cannot be caught for first place AND is
//     projected above 50%, but it is not yet a mathematical certainty.
//   * RUNOFF MATHEMATICALLY GUARANTEED — no candidate can still reach >50%.
// =============================================================================

import { candidateName, MAJOR_CANDIDATE_IDS, WIN_THRESHOLD } from '../data/candidates.js';

const VALID = ['HH', 'BM', 'FM', 'OTH'];

/**
 * @param {object} agg    aggregate() output
 * @param {object} model  buildModel() output
 * @param {object} point  pointForecast() output
 * @param {object} mc     runMonteCarlo() output
 */
export function analyzeRace(agg, model, point, mc) {
  const countedValid = agg.national.countedValid;
  const counted = agg.national.counted;
  const outstandingValid = model.units.reduce((a, u) => a + u.outstandingValid, 0);
  const totalValid = countedValid + outstandingValid; // projected final valid total
  const half = totalValid / 2;
  const reported = agg.national.pctCounted;

  // Current standings (counted only).
  const standings = VALID.map((cid) => ({ cid, votes: counted[cid] || 0 }))
    .sort((a, b) => b.votes - a.votes);
  const leader = standings[0];
  const second = standings[1];

  // Per-candidate arithmetic bounds.
  const bounds = {};
  for (const cid of VALID) {
    const v = counted[cid] || 0;
    bounds[cid] = {
      current: v,
      maxPossible: v + outstandingValid, // if they take ALL remaining valid votes
      minShareFinal: totalValid > 0 ? v / totalValid : 0,
      maxShareFinal: totalValid > 0 ? (v + outstandingValid) / totalValid : 0
    };
  }

  // Mathematical facts.
  const guaranteedOutright = leader.votes > half; // already >50% of max total
  const leaderCannotBeCaught = leader.votes > second.votes + outstandingValid;
  const anyoneCanReach50 = VALID.some((cid) => bounds[cid].maxPossible > half);
  const runoffGuaranteed = !anyoneCanReach50;

  // Probabilistic status from Monte Carlo + point forecast.
  const leaderP = mc.perCandidate[leader.cid];
  let status, statusClass, headline;
  const lname = candidateName(leader.cid);

  if (guaranteedOutright) {
    status = 'MATHEMATICALLY CONFIRMED';
    statusClass = 'confirmed';
    headline = `${lname} has secured an outright first-round win.`;
  } else if (runoffGuaranteed) {
    status = 'RUNOFF MATHEMATICALLY GUARANTEED';
    statusClass = 'runoff';
    headline = `No candidate can reach 50%+1 — a runoff is arithmetically certain.`;
  } else if (leaderCannotBeCaught && point.shares[leader.cid] > WIN_THRESHOLD && leaderP.winProb > 0.95) {
    status = 'PROJECTED WINNER';
    statusClass = 'projected';
    headline = `${lname} cannot be overtaken for first and is projected above 50%.`;
  } else if (reported < 0.08) {
    status = 'TOO EARLY TO CALL';
    statusClass = 'early';
    headline = `Only ${(reported * 100).toFixed(1)}% counted — far too early to project.`;
  } else if (leaderP.winProb > 0.9) {
    status = `LIKELY ${lname.toUpperCase()} WIN`;
    statusClass = 'likely';
    headline = `${lname} is very likely to win outright (${(leaderP.winProb * 100).toFixed(0)}%).`;
  } else if (mc.runoffProb > 0.6) {
    status = 'LIKELY RUNOFF';
    statusClass = 'runoff';
    headline = `The field is splitting — a runoff is the most likely outcome (${(mc.runoffProb * 100).toFixed(0)}%).`;
  } else if (leaderP.winProb > 0.65) {
    status = `LEANING ${lname.toUpperCase()}`;
    statusClass = 'leaning';
    headline = `${lname} leads but the outcome is not settled.`;
  } else {
    status = 'TOO CLOSE TO CALL';
    statusClass = 'tooclose';
    headline = `The race is within the model's uncertainty — too close to call.`;
  }

  // "What does the remaining vote need to look like?"
  const votesToWin = Math.max(0, Math.floor(half) + 1 - leader.votes);
  const required = MAJOR_CANDIDATE_IDS.map((cid) => {
    const v = counted[cid] || 0;
    const toOutright = Math.max(0, Math.floor(half) + 1 - v);
    const shareForOutright = outstandingValid > 0 ? toOutright / outstandingValid : Infinity;
    // Two-way share of the remaining needed to overtake the current leader.
    const gap = leader.votes - v;
    const shareToOvertake = cid === leader.cid ? null
      : outstandingValid > 0 ? 0.5 + gap / (2 * outstandingValid) : Infinity;
    return {
      cid,
      name: candidateName(cid),
      isLeader: cid === leader.cid,
      current: v,
      votesForOutright: toOutright,
      shareForOutright, // share of ALL remaining valid votes needed for >50%
      shareToOvertake, // two-way share of remaining needed to pass the leader
      outrightPossible: shareForOutright <= 1,
      overtakePossible: shareToOvertake === null ? true : shareToOvertake <= 1
    };
  });

  return {
    totalValidProjected: totalValid,
    countedValid,
    outstandingValid,
    half,
    leader: leader.cid,
    second: second.cid,
    leadVotes: leader.votes - second.votes,
    votesToWin,
    guaranteedOutright,
    leaderCannotBeCaught,
    runoffGuaranteed,
    status,
    statusClass,
    headline,
    standings,
    bounds,
    required
  };
}
