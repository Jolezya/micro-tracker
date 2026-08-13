import React from 'react';
import { Panel, Badge } from '../components/ui.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { HISTORICAL_ELECTIONS } from '../data/historical.js';
import { PROVINCES, provinceById } from '../data/geography.js';
import { candidateById, candidateName } from '../data/candidates.js';
import { PARTIES } from '../data/candidates.js';
import { pct, pts } from '../lib/format.js';

function shareOfParty(results, party) {
  const r = results.find((x) => x.party === party);
  return r ? r.share : 0;
}

export function Historical({ forecast }) {
  const { point } = forecast;

  const chartData = HISTORICAL_ELECTIONS.map((e) => ({
    year: String(e.year),
    UPND: +(shareOfParty(e.results, 'UPND') * 100).toFixed(1),
    PF: +(shareOfParty(e.results, 'PF') * 100).toFixed(1),
    Other: +(((shareOfParty(e.results, 'MMD') || 0) + shareOfParty(e.results, 'IND') + shareOfParty(e.results, 'SP')) * 100).toFixed(1)
  }));
  chartData.push({
    year: '2026*',
    UPND: +((point.shares.HH || 0) * 100).toFixed(1),
    PF: +((point.shares.BM || 0) * 100).toFixed(1),
    Other: +(((point.shares.FM || 0) + (point.shares.OTH || 0)) * 100).toFixed(1)
  });

  return (
    <div className="space-y-4">
      <Panel title="Historical presidential results" subtitle="2011 – 2026 · national two-party share (2026 = live projection*)">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--term-border))" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'rgb(var(--term-muted))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--term-muted))' }} unit="%" />
              <Tooltip contentStyle={{ background: 'rgb(var(--term-panel))', border: '1px solid rgb(var(--term-border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="UPND" fill={PARTIES.UPND.color} radius={[3, 3, 0, 0]} />
              <Bar dataKey="PF" fill={PARTIES.PF.color} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Other" fill={PARTIES.IND.color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-term-muted mt-2">*2026 bar is the current model projection (DEMO), not a final result. Historical figures are real ECZ results, rounded.</p>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Election-by-election" subtitle="Winner, turnout and top finishers">
          <div className="space-y-3">
            {HISTORICAL_ELECTIONS.map((e) => (
              <div key={e.year} className="rounded-lg border border-term-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-term-text">{e.year}</span>
                  <span className="text-xs text-term-muted tnum">Turnout {pct(e.turnout, 1)}</span>
                </div>
                <div className="text-xs text-term-accent mt-0.5">{e.winner}</div>
                <div className="text-[11px] text-term-muted mt-1">{e.note}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {e.results.map((r) => (
                    <span key={r.name} className="text-[11px] tnum text-term-muted">{r.name.split(' ').slice(-1)} <b className="text-term-text">{pct(r.share, 1)}</b></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Provincial shift: 2021 → 2026 projection" subtitle="How each province is moving vs its 2021 result">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left uppercase tracking-wider text-term-faint border-b border-term-border">
                  <th className="py-2 pr-2">Province</th><th className="py-2 px-2">2021 winner</th><th className="py-2 px-2">Proj. winner</th><th className="py-2 px-2 text-right">UPND→</th><th className="py-2 pl-2 text-right">PF→</th>
                </tr>
              </thead>
              <tbody>
                {PROVINCES.map((p) => {
                  const proj = point.byProvince[p.id];
                  const hist = p.hist2021;
                  const histLead = ['HH', 'BM', 'FM'].sort((a, b) => hist[b] - hist[a])[0];
                  const projLead = ['HH', 'BM', 'FM'].sort((a, b) => proj[b] - proj[a])[0];
                  return (
                    <tr key={p.id} className="border-b border-term-border/50 row-hover">
                      <td className="py-2 pr-2 text-term-text">{p.name}</td>
                      <td className="py-2 px-2"><Badge color={candidateById(histLead).color}>{candidateName(histLead)}</Badge></td>
                      <td className="py-2 px-2"><Badge color={candidateById(projLead).color}>{candidateName(projLead)}</Badge></td>
                      <td className="py-2 px-2 text-right tnum"><span className={proj.HH - hist.HH >= 0 ? 'text-term-good' : 'text-term-bad'}>{pts(proj.HH - hist.HH)}</span></td>
                      <td className="py-2 pl-2 text-right tnum"><span className={proj.BM - hist.BM >= 0 ? 'text-term-good' : 'text-term-bad'}>{pts(proj.BM - hist.BM)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
