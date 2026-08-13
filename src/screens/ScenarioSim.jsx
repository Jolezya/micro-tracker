import React, { useMemo, useState } from 'react';
import { Panel, Button, Badge, StatTile, Eyebrow } from '../components/ui.jsx';
import { computeForecast } from '../engine/pipeline.js';
import { emptyScenario, describeScenario, isScenarioActive } from '../engine/scenario.js';
import { useStore } from '../data/store.js';
import { PROVINCES, provinceById } from '../data/geography.js';
import { candidateById, candidateName, MAJOR_CANDIDATE_IDS } from '../data/candidates.js';
import { pct, pts } from '../lib/format.js';
import { SlidersHorizontal, RotateCcw, X } from 'lucide-react';

// distribute a target share to one candidate, rest split by province history
function remainingVectorFor(pid, cid, share) {
  const p = provinceById[pid];
  const others = ['HH', 'BM', 'FM', 'OTH'].filter((k) => k !== cid);
  const rest = 1 - share;
  const histSum = others.reduce((a, k) => a + p.hist2021[k], 0) || 1;
  const v = { [cid]: share };
  for (const k of others) v[k] = rest * (p.hist2021[k] / histSum);
  return v;
}

export function ScenarioSim({ forecast: baseline }) {
  const state = useStore();
  const [scenario, setScenario] = useState(emptyScenario);

  // controls
  const [bmRemaining, setBmRemaining] = useState(0.6);
  const [globalOn, setGlobalOn] = useState(false);
  const [turnProv, setTurnProv] = useState('CB');
  const [turnPct, setTurnPct] = useState(10);
  const [remProv, setRemProv] = useState('LSK');
  const [remCid, setRemCid] = useState('HH');
  const [remShare, setRemShare] = useState(0.55);

  const scenarioForCompute = useMemo(() => {
    const s = emptyScenario();
    if (globalOn) {
      const hh = (1 - bmRemaining) * 0.96;
      s.remainingShareGlobal = { HH: hh, BM: bmRemaining, FM: 0.02, OTH: 0.02 };
    }
    s.provinceTurnoutMultiplier = { ...scenario.provinceTurnoutMultiplier };
    s.provinceRemainingShare = { ...scenario.provinceRemainingShare };
    return s;
  }, [globalOn, bmRemaining, scenario]);

  const result = useMemo(
    () => computeForecast(state.results, { scenario: scenarioForCompute, iterations: 3000 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(scenarioForCompute), state.results.length]
  );

  const active = isScenarioActive(scenarioForCompute);
  const desc = describeScenario(scenarioForCompute);

  const applyTurnout = () => setScenario((s) => ({ ...s, provinceTurnoutMultiplier: { ...s.provinceTurnoutMultiplier, [turnProv]: 1 + turnPct / 100 } }));
  const applyRemaining = () => setScenario((s) => ({ ...s, provinceRemainingShare: { ...s.provinceRemainingShare, [remProv]: remainingVectorFor(remProv, remCid, remShare) } }));
  const clearProvTurnout = (pid) => setScenario((s) => { const m = { ...s.provinceTurnoutMultiplier }; delete m[pid]; return { ...s, provinceTurnoutMultiplier: m }; });
  const clearProvRemaining = (pid) => setScenario((s) => { const m = { ...s.provinceRemainingShare }; delete m[pid]; return { ...s, provinceRemainingShare: m }; });
  const resetAll = () => { setScenario(emptyScenario()); setGlobalOn(false); };

  const preset = (fn) => () => { resetAll(); fn(); };
  const presetMundubile60 = preset(() => { setGlobalOn(true); setBmRemaining(0.6); });
  const presetCopperbelt = preset(() => setScenario((s) => ({ ...s, provinceTurnoutMultiplier: { CB: 1.1 } })));
  const presetLusaka = preset(() => setScenario((s) => ({ ...s, provinceRemainingShare: { LSK: remainingVectorFor('LSK', 'HH', 0.55) } })));

  const cmp = (cid) => ({
    baseShare: baseline.point.shares[cid],
    scenShare: result.point.shares[cid],
    baseWin: baseline.mc.perCandidate[cid].winProb,
    scenWin: result.mc.perCandidate[cid].winProb
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Controls */}
      <div className="lg:col-span-2 space-y-4">
        <Panel title="Scenario assumptions" subtitle="Counted votes stay fixed — only the outstanding vote is re-modelled" right={<SlidersHorizontal size={16} className="text-term-accent" />}>
          <Eyebrow>Example scenarios</Eyebrow>
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            <Button size="sm" onClick={presetMundubile60}>Mundubile wins 60% of remaining</Button>
            <Button size="sm" onClick={presetCopperbelt}>Copperbelt turnout +10%</Button>
            <Button size="sm" onClick={presetLusaka}>Lusaka remaining 55% HH</Button>
          </div>

          <div className="space-y-4">
            {/* Global remaining share */}
            <div className="rounded-lg border border-term-border p-3">
              <label className="flex items-center gap-2 text-sm text-term-text">
                <input type="checkbox" checked={globalOn} onChange={(e) => setGlobalOn(e.target.checked)} />
                Force national remaining-vote split
              </label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-term-muted w-28">Mundubile share</span>
                <input type="range" min="0" max="100" value={Math.round(bmRemaining * 100)} onChange={(e) => setBmRemaining(+e.target.value / 100)} className="flex-1" disabled={!globalOn} />
                <span className="text-xs tnum w-10 text-right" style={{ color: candidateById('BM').color }}>{pct(bmRemaining, 0)}</span>
              </div>
            </div>

            {/* Province turnout */}
            <div className="rounded-lg border border-term-border p-3">
              <div className="text-sm text-term-text mb-2">Province turnout multiplier</div>
              <div className="flex items-center gap-2">
                <select value={turnProv} onChange={(e) => setTurnProv(e.target.value)} className="bg-term-panel2 border border-term-border rounded px-2 py-1 text-xs">
                  {PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="range" min="-30" max="30" value={turnPct} onChange={(e) => setTurnPct(+e.target.value)} className="flex-1" />
                <span className="text-xs tnum w-10 text-right">{turnPct >= 0 ? '+' : ''}{turnPct}%</span>
                <Button size="sm" onClick={applyTurnout}>Add</Button>
              </div>
            </div>

            {/* Province remaining share */}
            <div className="rounded-lg border border-term-border p-3">
              <div className="text-sm text-term-text mb-2">Force a province's remaining vote</div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={remProv} onChange={(e) => setRemProv(e.target.value)} className="bg-term-panel2 border border-term-border rounded px-2 py-1 text-xs">
                  {PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={remCid} onChange={(e) => setRemCid(e.target.value)} className="bg-term-panel2 border border-term-border rounded px-2 py-1 text-xs">
                  {MAJOR_CANDIDATE_IDS.map((c) => <option key={c} value={c}>{candidateName(c)}</option>)}
                </select>
                <input type="range" min="0" max="100" value={Math.round(remShare * 100)} onChange={(e) => setRemShare(+e.target.value / 100)} className="flex-1" />
                <span className="text-xs tnum w-10 text-right">{pct(remShare, 0)}</span>
                <Button size="sm" onClick={applyRemaining}>Add</Button>
              </div>
            </div>
          </div>

          {(desc.length > 0) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Eyebrow>Active assumptions</Eyebrow>
                <Button size="sm" variant="ghost" onClick={resetAll}><RotateCcw size={12} /> Reset</Button>
              </div>
              <div className="space-y-1.5">
                {globalOn && <div className="text-xs text-term-muted">• All remaining: Mundubile {pct(bmRemaining, 0)}.</div>}
                {Object.keys(scenario.provinceTurnoutMultiplier).map((pid) => (
                  <div key={pid} className="flex items-center justify-between text-xs text-term-muted">
                    <span>• {provinceById[pid].name} turnout {scenario.provinceTurnoutMultiplier[pid] >= 1 ? '+' : ''}{Math.round((scenario.provinceTurnoutMultiplier[pid] - 1) * 100)}%</span>
                    <button onClick={() => clearProvTurnout(pid)} className="text-term-faint hover:text-term-bad"><X size={12} /></button>
                  </div>
                ))}
                {Object.keys(scenario.provinceRemainingShare).map((pid) => {
                  const v = scenario.provinceRemainingShare[pid];
                  const top = ['HH', 'BM', 'FM', 'OTH'].sort((a, b) => v[b] - v[a])[0];
                  return (
                    <div key={pid} className="flex items-center justify-between text-xs text-term-muted">
                      <span>• {provinceById[pid].name} remaining → {candidateName(top)} {pct(v[top], 0)}</span>
                      <button onClick={() => clearProvRemaining(pid)} className="text-term-faint hover:text-term-bad"><X size={12} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Results */}
      <div className="lg:col-span-3 space-y-4">
        <Panel title="Recalculated outcome" subtitle={active ? 'Scenario applied to the outstanding vote' : 'No assumptions active — this equals the live model'}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <StatTile label="Projected winner" value={result.race.statusClass === 'runoff' ? 'Runoff' : candidateName(result.point.leader)} tone="good" />
            <StatTile label="Status" value={result.race.status} />
            <StatTile label="Runoff prob." value={pct(result.mc.runoffProb, 0)} sub={`base ${pct(baseline.mc.runoffProb, 0)}`} tone="accent" />
            <StatTile label="Margin" value={pts(result.point.margin) + ' pts'} />
          </div>

          <div className="space-y-3">
            {MAJOR_CANDIDATE_IDS.map((cid) => {
              const c = cmp(cid);
              const cand = candidateById(cid);
              const dWin = c.scenWin - c.baseWin;
              const dShare = c.scenShare - c.baseShare;
              return (
                <div key={cid} className="rounded-lg border border-term-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-term-text">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: cand.color }} />{cand.name}
                    </span>
                    <span className={`text-xs tnum ${dWin > 0.005 ? 'text-term-good' : dWin < -0.005 ? 'text-term-bad' : 'text-term-faint'}`}>
                      win {pct(c.scenWin, 0)} ({dWin >= 0 ? '+' : ''}{(dWin * 100).toFixed(0)}pts)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-term-faint mb-1">Projected share</div>
                      <div className="flex items-center gap-2">
                        <span className="tnum text-term-muted">{pct(c.baseShare, 1)}</span>
                        <span className="text-term-faint">→</span>
                        <span className="tnum font-semibold" style={{ color: cand.color }}>{pct(c.scenShare, 1)}</span>
                        <span className={`tnum ${dShare > 0.0005 ? 'text-term-good' : dShare < -0.0005 ? 'text-term-bad' : 'text-term-faint'}`}>({pts(dShare)})</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-term-faint mb-1">Win probability</div>
                      <div className="w-full h-2 rounded-full bg-term-panel2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.scenWin * 100}%`, background: cand.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-term-muted">Scenarios are what-ifs and never modify stored results. Baseline = the live reproducible model with no assumptions.</p>
        </Panel>
      </div>
    </div>
  );
}
