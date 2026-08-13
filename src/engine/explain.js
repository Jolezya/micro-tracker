// =============================================================================
//  MODEL EXPLANATION — "why is the model predicting this?"
// -----------------------------------------------------------------------------
//  Turns the model state into the major drivers behind the projection, in plain
//  language. Never output a probability without the reasons behind it.
// =============================================================================

import { PROVINCES, provinceById } from '../data/geography.js';
import { candidateName } from '../data/candidates.js';

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const pts = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}pts`;

export function generateExplanation({ agg, model, point, mc, race }) {
  const reported = agg.national.pctCounted;
  const leader = race.leader;
  const second = race.second;
  const leaderP = mc.perCandidate[leader];

  // Where is the outstanding vote, and who does it historically favour?
  let outTotal = 0;
  const outByLeanLeader = { leader: 0, second: 0, other: 0 };
  const outstandingProvinces = [];
  for (const p of PROVINCES) {
    const u = model.units.filter((x) => x.provinceId === p.id);
    const out = u.reduce((a, x) => a + x.outstandingValid, 0);
    outTotal += out;
    const lean = ['HH', 'BM', 'FM'].sort((a, b) => p.hist2021[b] - p.hist2021[a])[0];
    if (lean === leader) outByLeanLeader.leader += out;
    else if (lean === second) outByLeanLeader.second += out;
    else outByLeanLeader.other += out;
    if (out > 0) outstandingProvinces.push({ pid: p.id, name: p.name, out, lean });
  }
  outstandingProvinces.sort((a, b) => b.out - a.out);
  const shareOutToSecond = outTotal > 0 ? outByLeanLeader.second / outTotal : 0;
  const shareOutToLeader = outTotal > 0 ? outByLeanLeader.leader / outTotal : 0;

  const drivers = [];

  drivers.push({
    label: 'Count progress',
    detail: `${pct(reported)} of the expected vote is counted (${agg.national.constituenciesReported}/${agg.national.constituenciesTotal} reporting units). The current count leads ${candidateName(leader)} on ${pct(agg.national.shares[leader])}.`
  });

  drivers.push({
    label: 'Reporting bias correction',
    detail: outTotal > 0
      ? `${pct(shareOutToSecond)} of the outstanding vote sits in provinces that historically favour ${candidateName(second)}, versus ${pct(shareOutToLeader)} in ${candidateName(leader)}-leaning provinces. The model does NOT extrapolate the current national share — it projects each outstanding area from its own 2021 pattern plus the observed swing.`
      : `All expected vote is effectively counted; no outstanding-vote modelling remains.`
  });

  const swingLeader = model.swing[leader] || 0;
  drivers.push({
    label: 'Observed swing vs 2021',
    detail: `In areas already counted, ${candidateName(leader)} is running ${pts(swingLeader)} vs 2021 and ${candidateName(second)} ${pts(model.swing[second] || 0)}. This swing is applied to the outstanding vote, not the raw national lead.`
  });

  drivers.push({
    label: 'Projection & uncertainty',
    detail: `Central projection: ${candidateName(leader)} ${pct(point.shares[leader])}, ${candidateName(second)} ${pct(point.shares[second])}. Monte Carlo (${mc.iterations.toLocaleString()} runs) gives ${candidateName(leader)} a ${pct(leaderP.winProb)} chance of an outright (>50%) win, with a ${pct(mc.runoffProb)} chance of a runoff.`
  });

  const topOut = outstandingProvinces.slice(0, 3).map((p) => `${p.name} (~${Math.round(p.out).toLocaleString()}, leans ${candidateName(p.lean)})`).join(', ');
  if (topOut) {
    drivers.push({
      label: 'Key outstanding areas',
      detail: `Largest outstanding blocks: ${topOut}.`
    });
  }

  const summary =
    `${candidateName(leader)} leads by ${pts(point.shares[leader] - point.shares[second])} in the projection with ${pct(reported)} of the expected vote counted. ` +
    (outTotal > 0
      ? `However, ${pct(shareOutToSecond)} of the outstanding vote is in provinces where ${candidateName(second)} historically performs strongly, so the model tempers the current lead and estimates a ${pct(leaderP.winProb)} probability of an outright ${candidateName(leader)} win (${pct(mc.runoffProb)} runoff).`
      : `With counting essentially complete, the result is settled.`);

  return { summary, drivers, outstandingProvinces };
}

export { pct, pts };
