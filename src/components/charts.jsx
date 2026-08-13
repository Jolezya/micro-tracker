import React from 'react';
import { candidateById, candidateName } from '../data/candidates.js';
import { pct } from '../lib/format.js';

// Stacked vote-share bar (HH | BM | FM | OTH) --------------------------------
export function VoteShareBar({ shares, height = 10, showThreshold = false }) {
  const order = ['HH', 'BM', 'FM', 'OTH'];
  return (
    <div className="relative w-full rounded-full overflow-hidden" style={{ height, background: 'rgb(var(--term-panel2))' }}>
      <div className="flex h-full w-full">
        {order.map((cid) => (
          <div
            key={cid}
            style={{ width: `${(shares[cid] || 0) * 100}%`, background: candidateById(cid).color, transition: 'width .5s ease' }}
            title={`${candidateName(cid)} ${pct(shares[cid])}`}
          />
        ))}
      </div>
      {showThreshold && (
        <div className="absolute top-0 bottom-0" style={{ left: '50%', width: 2, background: 'rgb(var(--term-text))', opacity: 0.65 }} title="50% threshold" />
      )}
    </div>
  );
}

// Credible-interval bar for a candidate's projected share --------------------
// domain default 25%–75%. Shows 95 / 80 / 50 nested intervals + median + 50% line.
export function CredibleIntervalBar({ candidateId, stat, domain = [0.25, 0.75] }) {
  const color = candidateById(candidateId).color;
  const [lo, hi] = domain;
  const span = hi - lo;
  const toX = (v) => `${((Math.max(lo, Math.min(hi, v)) - lo) / span) * 100}%`;
  const width = (a, b) => `${((Math.min(hi, b) - Math.max(lo, a)) / span) * 100}%`;
  const fifty = toX(0.5);
  return (
    <div className="relative w-full h-7" title="50% / 80% / 95% credible intervals">
      {/* baseline */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-term-border" />
      {/* 50% threshold */}
      <div className="absolute top-0 bottom-0" style={{ left: fifty, width: 1, background: 'rgb(var(--term-faint))' }} />
      {/* 95 */}
      <div className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ left: toX(stat.ci95[0]), width: width(stat.ci95[0], stat.ci95[1]), height: 6, background: color, opacity: 0.22 }} />
      {/* 80 */}
      <div className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ left: toX(stat.ci80[0]), width: width(stat.ci80[0], stat.ci80[1]), height: 10, background: color, opacity: 0.4 }} />
      {/* 50 */}
      <div className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ left: toX(stat.ci50[0]), width: width(stat.ci50[0], stat.ci50[1]), height: 14, background: color, opacity: 0.7 }} />
      {/* median */}
      <div className="absolute top-1/2 -translate-y-1/2" style={{ left: toX(stat.median), width: 3, height: 20, background: color, borderRadius: 2 }} />
    </div>
  );
}

// Win-probability horizontal bar ---------------------------------------------
export function ProbabilityBar({ candidateId, prob, label }) {
  const color = candidateById(candidateId).color;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-term-text">{label || candidateName(candidateId)}</span>
        <span className="tnum font-semibold" style={{ color }}>{pct(prob, 0)}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgb(var(--term-panel2))' }}>
        <div className="h-full rounded-full" style={{ width: `${prob * 100}%`, background: color, transition: 'width .5s ease' }} />
      </div>
    </div>
  );
}

// Legend ---------------------------------------------------------------------
export function CandidateLegend({ ids = ['HH', 'BM', 'FM', 'OTH'] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {ids.map((cid) => (
        <div key={cid} className="flex items-center gap-1.5 text-xs text-term-muted">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: candidateById(cid).color }} />
          {candidateById(cid).shortName}
        </div>
      ))}
    </div>
  );
}
