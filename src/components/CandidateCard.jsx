import React from 'react';
import { candidateById } from '../data/candidates.js';
import { num, pct, pts } from '../lib/format.js';
import { Badge } from './ui.jsx';
import { PARTIES } from '../data/candidates.js';

// Main candidate card. Clearly separates COUNTED (actual) from PROJECTED (model).
export function CandidateCard({ cid, agg, point, mc, prevShares, rank }) {
  const c = candidateById(cid);
  const share = agg.national.shares[cid] || 0;
  const votes = agg.national.counted[cid] || 0;
  const stat = mc.perCandidate[cid];
  const projected = point.shares[cid] || 0;
  const delta = prevShares ? share - (prevShares[cid] || 0) : 0;
  const winProb = stat.winProb;

  return (
    <div className="rounded-xl border border-term-border bg-term-panel overflow-hidden">
      <div className="h-1" style={{ background: c.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-term-faint shrink-0">#{rank}</span>
              <h3 className="text-base font-semibold text-term-text leading-tight">{c.name}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge color={c.color}>{c.party}</Badge>
              <span className="text-[11px] text-term-muted truncate">{PARTIES[c.party]?.name}</span>
              {c.incumbent && <Badge>Incumbent</Badge>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-term-faint">Win prob.</div>
            <div className="text-2xl font-bold tnum" style={{ color: c.color }}>{pct(winProb, 0)}</div>
          </div>
        </div>

        {/* COUNTED */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-term-faint">Counted vote share</div>
            <div className="text-3xl font-bold tnum text-term-text">{pct(share, 1)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm tnum text-term-text">{num(votes)}</div>
            <div className={`text-xs tnum ${delta > 0.0005 ? 'text-term-good' : delta < -0.0005 ? 'text-term-bad' : 'text-term-faint'}`}>
              {Math.abs(delta) < 0.0005 ? '—' : `${pts(delta)} pts`}
            </div>
          </div>
        </div>

        <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden bg-term-panel2">
          <div className="h-full rounded-full" style={{ width: `${share * 100}%`, background: c.color, transition: 'width .5s ease' }} />
        </div>

        {/* PROJECTED (model — visually distinct: dashed / muted) */}
        <div className="mt-4 rounded-lg border border-dashed border-term-border bg-term-panel2/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-term-faint">Projected final share (model)</span>
            <span className="text-sm font-semibold tnum" style={{ color: c.color }}>{pct(projected, 1)}</span>
          </div>
          <div className="mt-1.5 text-[11px] text-term-muted tnum">
            95% interval {pct(stat.ci95[0], 1)} – {pct(stat.ci95[1], 1)}
          </div>
        </div>
      </div>
    </div>
  );
}
