import React, { useEffect, useRef, useState } from 'react';
import { Panel, Button, Badge } from '../components/ui.jsx';
import { RaceStatus } from '../components/RaceStatus.jsx';
import { VoteShareBar } from '../components/charts.jsx';
import { useStore, selectors, advanceCount, resetToDemo } from '../data/store.js';
import { candidateById, candidateName } from '../data/candidates.js';
import { num, pct, pts, clockTime, timeAgo } from '../lib/format.js';
import { Play, Pause, FastForward, RotateCcw, Radio } from 'lucide-react';

export function ElectionNight({ forecast }) {
  const state = useStore();
  const snaps = selectors.snapshots(state);
  const prev = snaps.length >= 2 ? snaps[snaps.length - 2] : null;
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        const added = advanceCount(2);
        if (!added) setPlaying(false);
      }, 3500);
    }
    return () => clearInterval(timer.current);
  }, [playing]);

  const { agg, point, mc, race } = forecast;
  const order = point.order;
  const done = agg.national.constituenciesReported >= agg.national.constituenciesTotal;

  return (
    <div className="space-y-4">
      <Panel
        title={<span className="inline-flex items-center gap-2"><Radio size={15} className="text-term-bad" /> LIVE NATIONAL RESULT</span>}
        subtitle="Election night mode — updates as returns arrive"
        right={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => advanceCount(3)} disabled={done}><FastForward size={13} /> Advance</Button>
            <Button size="sm" variant={playing ? 'danger' : 'primary'} onClick={() => setPlaying((p) => !p)} disabled={done}>
              {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Auto-play</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setPlaying(false); resetToDemo(); }}><RotateCcw size={13} /> Reset</Button>
          </div>
        }
      >
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-term-faint border-b border-term-border">
                <th className="py-2 pr-3">Candidate</th>
                <th className="py-2 px-3 text-right">Votes</th>
                <th className="py-2 px-3 text-right">%</th>
                <th className="py-2 px-3 text-right">Change</th>
                <th className="py-2 px-3 text-right">Projection</th>
                <th className="py-2 pl-3 text-right">Win prob.</th>
              </tr>
            </thead>
            <tbody>
              {order.map((cid) => {
                const c = candidateById(cid);
                const share = agg.national.shares[cid] || 0;
                const delta = prev ? share - (prev.shares[cid] || 0) : 0;
                return (
                  <tr key={cid} className="border-b border-term-border/60">
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
                        <span className="font-medium text-term-text">{c.name}</span>
                        <Badge color={c.color}>{c.party}</Badge>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tnum text-term-text">{num(agg.national.counted[cid] || 0)}</td>
                    <td className="py-2.5 px-3 text-right tnum font-semibold text-term-text">{pct(share, 1)}</td>
                    <td className={`py-2.5 px-3 text-right tnum ${delta > 0.0005 ? 'text-term-good' : delta < -0.0005 ? 'text-term-bad' : 'text-term-faint'}`}>
                      {Math.abs(delta) < 0.0005 ? '—' : pts(delta)}
                    </td>
                    <td className="py-2.5 px-3 text-right tnum" style={{ color: c.color }}>{pct(point.shares[cid], 1)}</td>
                    <td className="py-2.5 pl-3 text-right tnum font-semibold" style={{ color: c.color }}>{pct(mc.perCandidate[cid].winProb, 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <VoteShareBar shares={agg.national.shares} height={12} showThreshold />
          <div className="flex justify-between mt-1 text-[11px] text-term-faint tnum">
            <span>{pct(agg.national.pctCounted, 1)} counted</span>
            <span>50% line</span>
            <span>{num(agg.national.countedCast)} votes</span>
          </div>
        </div>
      </Panel>

      <RaceStatus race={race} mc={mc} />

      <Panel title="Live timeline" subtitle="Major changes as the count progressed">
        {snaps.length <= 1 ? (
          <p className="text-sm text-term-muted">No updates yet. Use “Advance” or “Auto-play” to bring in returns.</p>
        ) : (
          <ol className="relative border-l border-term-border ml-2">
            {snaps.slice().reverse().map((s, i, arr) => {
              const younger = arr[i - 1]; // more recent neighbour (since reversed)
              const older = arr[i + 1];
              const leadChanged = older && older.leader !== s.leader;
              return (
                <li key={s.id} className="ml-4 pb-4">
                  <span className="absolute -left-[6px] w-3 h-3 rounded-full" style={{ background: s.leader ? candidateById(s.leader).color : 'rgb(var(--term-border))' }} />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-term-faint tnum">{clockTime(s.at)}</span>
                    <span className="text-sm text-term-text">{s.label}</span>
                    {leadChanged && <Badge color="rgb(var(--term-warn))">lead change → {candidateName(s.leader)}</Badge>}
                  </div>
                  <div className="text-xs text-term-muted tnum mt-0.5">
                    {pct(s.pctCounted, 1)} counted · {s.leader ? `${candidateName(s.leader)} ${pct(s.shares[s.leader], 1)}` : 'no leader'} · {s.constituenciesReported} units
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </div>
  );
}
