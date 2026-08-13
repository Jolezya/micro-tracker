import React from 'react';
import { PROVINCES, provinceById } from '../data/geography.js';
import { candidateById, candidateName } from '../data/candidates.js';
import { pct } from '../lib/format.js';

// A TILE CARTOGRAM of Zambia's 10 provinces (schematic, not a projection).
// Grid positions in geography.js loosely mirror the real arrangement:
//   north at top (Luapula/Northern/Muchinga), UPND south/west at the bottom.
const COLS = 5;
const ROWS = 5;

function leaderColor(shares) {
  if (!shares) return 'rgb(var(--term-panel2))';
  const lead = ['HH', 'BM', 'FM'].sort((a, b) => (shares[b] || 0) - (shares[a] || 0))[0];
  return { color: candidateById(lead).color, lead };
}

export function ZambiaMap({ agg, point, mode = 'leader', selected, onSelect }) {
  return (
    <div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0,1fr))`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
      >
        {PROVINCES.map((p) => {
          const a = agg.byProvince[p.id];
          const pShares = point?.byProvince?.[p.id];
          let bg = 'rgb(var(--term-panel2))';
          let label = '';
          let leadId = null;

          if (mode === 'leader') {
            const li = leaderColor(a.shares);
            if (li.color) {
              const op = Math.max(0.28, Math.min(1, a.reportingPct + 0.15));
              bg = li.color + Math.round(op * 255).toString(16).padStart(2, '0');
              leadId = li.lead;
            }
            label = a.countedValid > 0 ? `${candidateName(li.lead)} ${pct(a.shares[li.lead], 0)}` : 'No data';
          } else if (mode === 'projected') {
            const li = leaderColor(pShares);
            bg = li.color;
            leadId = li.lead;
            label = pShares ? `${candidateName(li.lead)} ${pct(pShares[li.lead], 0)}` : '—';
          } else if (mode === 'reporting') {
            const op = Math.max(0.12, a.reportingPct);
            bg = `rgba(94,179,255,${op})`;
            label = pct(a.reportingPct, 0) + ' in';
          } else if (mode === 'turnout') {
            const t = a.countedCast / Math.max(1, p.registeredVoters);
            const op = Math.max(0.12, Math.min(1, t / 0.8));
            bg = `rgba(45,212,167,${op})`;
            label = pct(t, 0);
          }

          const isSel = selected === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect && onSelect(isSel ? null : p.id)}
              style={{ gridColumn: p.grid.col + 1, gridRow: p.grid.row + 1, background: bg }}
              className={`relative rounded-lg border text-left p-2 min-h-[64px] transition-transform hover:scale-[1.03] ${
                isSel ? 'border-term-text ring-2 ring-term-accent' : 'border-term-border'
              }`}
              title={`${p.name} — ${p.lean}`}
            >
              <div className="text-[11px] font-bold text-white mix-blend-luminosity drop-shadow tnum" style={{ textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>
                {p.abbr}
              </div>
              <div className="text-[9px] leading-tight text-white/90 mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,.55)' }}>
                {label}
              </div>
              <div className="absolute bottom-1 right-1 text-[8px] text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
                {a.constituenciesReported}/{a.constituenciesTotal}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProvinceDetail({ pid, agg, point }) {
  const p = provinceById[pid];
  const a = agg.byProvince[pid];
  const proj = point?.byProvince?.[pid];
  const cids = ['HH', 'BM', 'FM', 'OTH'];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-term-text">{p.name}</h3>
        <span className="text-xs text-term-muted">{p.lean}</span>
      </div>
      <div className="mt-3 space-y-2">
        {cids.map((cid) => (
          <div key={cid} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-term-muted">{candidateName(cid)}</span>
            <div className="flex-1 h-2 rounded-full bg-term-panel2 overflow-hidden">
              <div className="h-full" style={{ width: `${(a.shares[cid] || 0) * 100}%`, background: candidateById(cid).color }} />
            </div>
            <span className="w-12 text-right tnum text-term-text">{pct(a.shares[cid], 1)}</span>
            <span className="w-16 text-right tnum text-term-faint" title="Projected final">{proj ? `→ ${pct(proj[cid], 1)}` : ''}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="rounded-lg bg-term-panel2 p-2">
          <div className="text-[10px] text-term-faint uppercase">Reported</div>
          <div className="text-sm font-semibold tnum">{a.constituenciesReported}/{a.constituenciesTotal}</div>
        </div>
        <div className="rounded-lg bg-term-panel2 p-2">
          <div className="text-[10px] text-term-faint uppercase">% counted</div>
          <div className="text-sm font-semibold tnum">{pct(a.reportingPct, 0)}</div>
        </div>
        <div className="rounded-lg bg-term-panel2 p-2">
          <div className="text-[10px] text-term-faint uppercase">Outstanding</div>
          <div className="text-sm font-semibold tnum">{Math.round(a.outstanding).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
