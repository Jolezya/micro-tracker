import React from 'react';
import { ProbabilityBar } from './charts.jsx';
import { pct } from '../lib/format.js';
import { MAJOR_CANDIDATE_IDS } from '../data/candidates.js';
import { ArrowRight } from 'lucide-react';

const STATUS_COLOR = {
  confirmed: 'rgb(var(--term-good))',
  projected: 'rgb(var(--term-good))',
  likely: 'rgb(var(--term-accent))',
  leaning: 'rgb(var(--term-warn))',
  runoff: '#b78cff',
  tooclose: 'rgb(var(--term-warn))',
  early: 'rgb(var(--term-faint))'
};

export function RaceStatus({ race, mc, onNavigate, compact = false }) {
  const color = STATUS_COLOR[race.statusClass] || 'rgb(var(--term-accent))';
  return (
    <section className="rounded-xl border bg-term-panel overflow-hidden" style={{ borderColor: color + '55' }}>
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ background: color + '14' }}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wide text-white" style={{ background: color }}>
            {race.status}
          </span>
          <p className="text-sm text-term-text">{race.headline}</p>
        </div>
        {onNavigate && (
          <button onClick={() => onNavigate('forecast')} className="inline-flex items-center gap-1 text-xs text-term-muted hover:text-term-text whitespace-nowrap">
            Why this projection? <ArrowRight size={13} />
          </button>
        )}
      </div>
      {!compact && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MAJOR_CANDIDATE_IDS.map((cid) => (
            <ProbabilityBar key={cid} candidateId={cid} prob={mc.perCandidate[cid].winProb} />
          ))}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-term-text">Runoff</span>
              <span className="tnum font-semibold" style={{ color: '#b78cff' }}>{pct(mc.runoffProb, 0)}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden bg-term-panel2">
              <div className="h-full rounded-full" style={{ width: `${mc.runoffProb * 100}%`, background: '#b78cff' }} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
