import React from 'react';
import { Panel, Meter, Badge, StatTile } from '../components/ui.jsx';
import { PROVINCES, provinceById } from '../data/geography.js';
import { candidateById, candidateName } from '../data/candidates.js';
import { num, pct, compact } from '../lib/format.js';
import { AlertTriangle } from 'lucide-react';

export function Reporting({ forecast }) {
  const { agg, outstanding, explanation, race } = forecast;

  const provinces = PROVINCES.map((p) => ({ p, a: agg.byProvince[p.id] })).sort((x, y) => y.a.expectedTotal - x.a.expectedTotal);
  const totalOutstanding = outstanding.reduce((s, o) => s + o.outstanding, 0);
  const outstandingUnits = outstanding.length;

  // How much of the outstanding sits in second-place-leaning provinces?
  const second = race.second;
  const outToSecond = explanation.outstandingProvinces.filter((o) => o.lean === second).reduce((s, o) => s + o.out, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatTile label="Outstanding units" value={outstandingUnits} sub="not yet fully reported" tone="warn" />
        <StatTile label="Outstanding votes" value={compact(totalOutstanding)} sub={`${num(totalOutstanding)} expected`} tone="accent" />
        <StatTile label={`In ${candidateName(second)}-leaning areas`} value={pct(totalOutstanding ? outToSecond / totalOutstanding : 0, 0)} sub="of outstanding vote" />
        <StatTile label="Counted" value={pct(agg.national.pctCounted, 0)} sub="of expected national vote" />
      </div>

      <Panel title="Provincial reporting progress" subtitle="Expected · counted · outstanding, with historical tendency">
        <div className="space-y-3">
          {provinces.map(({ p, a }) => {
            const lead = a.countedValid > 0 ? ['HH', 'BM', 'FM'].sort((x, y) => a.shares[y] - a.shares[x])[0] : null;
            return (
              <div key={p.id} className="grid grid-cols-12 items-center gap-2 text-xs">
                <div className="col-span-3 md:col-span-2">
                  <div className="font-medium text-term-text">{p.name}</div>
                  <div className="text-[10px] text-term-faint">{p.lean}</div>
                </div>
                <div className="col-span-4 md:col-span-5">
                  <Meter value={a.reportingPct} color={lead ? candidateById(lead).color : 'rgb(var(--term-accent))'} height={8} />
                  <div className="flex justify-between text-[10px] text-term-faint mt-1 tnum">
                    <span>{num(a.countedCast)} counted</span>
                    <span>{num(Math.round(a.outstanding))} outstanding</span>
                  </div>
                </div>
                <div className="col-span-2 text-right tnum text-term-text">{pct(a.reportingPct, 0)}</div>
                <div className="col-span-2 text-right">{lead ? <Badge color={candidateById(lead).color}>{candidateName(lead)}</Badge> : <span className="text-term-faint">no data</span>}</div>
                <div className="col-span-1 text-right text-[10px] text-term-faint tnum">{a.constituenciesReported}/{a.constituenciesTotal}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Key areas still outstanding" subtitle="Largest blocks of expected vote not yet reported" right={<AlertTriangle size={16} className="text-term-warn" />}>
        <div className="rounded-lg border border-term-warn/30 bg-term-warn/10 px-3 py-2 text-sm text-term-text mb-3">
          <b className="tnum">{outstandingUnits}</b> constituencies representing approximately <b className="tnum">{num(Math.round(totalOutstanding))}</b> expected votes have not fully reported.
          {' '}Of these, ~<b className="tnum">{pct(totalOutstanding ? outToSecond / totalOutstanding : 0, 0)}</b> are in provinces that historically favour {candidateName(second)} — which is why the model tempers the current lead.
        </div>
        <div className="overflow-x-auto scroll-thin max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-term-panel">
              <tr className="text-left uppercase tracking-wider text-term-faint border-b border-term-border">
                <th className="py-2 pr-2">Constituency</th>
                <th className="py-2 px-2">Province</th>
                <th className="py-2 px-2">Hist. lean</th>
                <th className="py-2 px-2 text-right">Reporting</th>
                <th className="py-2 pl-2 text-right">Est. outstanding</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.slice(0, 40).map((o) => {
                const p = provinceById[o.provinceId];
                const lean = ['HH', 'BM', 'FM'].sort((a, b) => p.hist2021[b] - p.hist2021[a])[0];
                return (
                  <tr key={o.constituencyId} className="border-b border-term-border/50 row-hover">
                    <td className="py-2 pr-2 text-term-text">{o.name}</td>
                    <td className="py-2 px-2 text-term-muted">{o.provinceName}</td>
                    <td className="py-2 px-2"><Badge color={candidateById(lean).color}>{candidateName(lean)}</Badge></td>
                    <td className="py-2 px-2 text-right tnum">{o.hasData ? pct(o.reportingPct, 0) : <span className="text-term-faint">0%</span>}</td>
                    <td className="py-2 pl-2 text-right tnum">{num(Math.round(o.outstanding))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
