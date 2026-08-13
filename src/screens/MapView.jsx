import React, { useState } from 'react';
import { Panel, Tabs, Badge, Empty } from '../components/ui.jsx';
import { ZambiaMap, ProvinceDetail } from '../components/ZambiaMap.jsx';
import { CandidateLegend } from '../components/charts.jsx';
import { constituenciesByProvince, provinceById } from '../data/geography.js';
import { candidateById, candidateName } from '../data/candidates.js';
import { num, pct, pts } from '../lib/format.js';

const MODES = [
  { id: 'leader', label: 'Leader (counted)' },
  { id: 'projected', label: 'Leader (projected)' },
  { id: 'reporting', label: '% reporting' },
  { id: 'turnout', label: 'Turnout' }
];

function leaderOf(shares) {
  return ['HH', 'BM', 'FM'].sort((a, b) => (shares[b] || 0) - (shares[a] || 0))[0];
}

export function MapView({ forecast }) {
  const { agg, point } = forecast;
  const [mode, setMode] = useState('leader');
  const [selected, setSelected] = useState(null);

  const cons = selected ? constituenciesByProvince(selected) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Panel title="Zambia — provincial map" subtitle="Tile cartogram (schematic). Click a province to drill down." right={<Tabs tabs={MODES} active={mode} onChange={setMode} />}>
          <ZambiaMap agg={agg} point={point} mode={mode} selected={selected} onSelect={setSelected} />
          <div className="mt-3 flex items-center justify-between">
            <CandidateLegend />
            <span className="text-[11px] text-term-faint">Tile opacity ∝ share of vote counted · corner = constituencies reported</span>
          </div>
        </Panel>

        {selected && (
          <Panel title={`${provinceById[selected].name} — constituencies`} subtitle="Province → constituency drill-down" right={<button onClick={() => setSelected(null)} className="text-xs text-term-muted hover:text-term-text">Clear</button>}>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left uppercase tracking-wider text-term-faint border-b border-term-border">
                    <th className="py-2 pr-2">Constituency</th>
                    <th className="py-2 px-2 text-right">Reporting</th>
                    <th className="py-2 px-2">Leader</th>
                    <th className="py-2 px-2 text-right">Counted</th>
                    <th className="py-2 px-2 text-right">Outstanding</th>
                    <th className="py-2 px-2">2021</th>
                    <th className="py-2 pl-2 text-right">Swing</th>
                  </tr>
                </thead>
                <tbody>
                  {cons.map((c) => {
                    const a = agg.byConstituency[c.id];
                    const curLead = a.hasData ? leaderOf(a.shares) : null;
                    const histLead = leaderOf(c.hist2021);
                    const swing = a.hasData ? a.shares[curLead] - c.hist2021[curLead] : 0;
                    return (
                      <tr key={c.id} className="border-b border-term-border/50 row-hover">
                        <td className="py-2 pr-2 text-term-text">{c.name}</td>
                        <td className="py-2 px-2 text-right tnum">{a.hasData ? pct(a.reportingPct, 0) : <span className="text-term-faint">—</span>}</td>
                        <td className="py-2 px-2">{curLead ? <Badge color={candidateById(curLead).color}>{candidateName(curLead)}</Badge> : <span className="text-term-faint">no data</span>}</td>
                        <td className="py-2 px-2 text-right tnum">{a.hasData ? num(a.countedCast) : '—'}</td>
                        <td className="py-2 px-2 text-right tnum">{num(a.outstanding)}</td>
                        <td className="py-2 px-2"><span className="text-term-muted">{candidateName(histLead)}</span></td>
                        <td className="py-2 pl-2 text-right tnum">{a.hasData ? <span className={swing >= 0 ? 'text-term-good' : 'text-term-bad'}>{pts(swing)}</span> : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Panel title="Province detail">
          {selected ? <ProvinceDetail pid={selected} agg={agg} point={point} /> : <Empty>Select a province on the map to see counted vs projected shares, reporting progress and outstanding votes.</Empty>}
        </Panel>
      </div>
    </div>
  );
}
