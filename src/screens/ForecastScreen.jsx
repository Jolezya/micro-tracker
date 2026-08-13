import React from 'react';
import { Panel, StatTile, Badge, Eyebrow } from '../components/ui.jsx';
import { CredibleIntervalBar } from '../components/charts.jsx';
import { candidateById, candidateName, MAJOR_CANDIDATE_IDS } from '../data/candidates.js';
import { num, pct, pts } from '../lib/format.js';
import { Lightbulb, Dice5, Target, Split } from 'lucide-react';

export function ForecastScreen({ forecast }) {
  const { agg, point, mc, race, explanation } = forecast;

  // Shared domain for the credible-interval bars (covers HH & BM, includes 50%).
  const lows = MAJOR_CANDIDATE_IDS.map((c) => mc.perCandidate[c].ci95[0]);
  const highs = MAJOR_CANDIDATE_IDS.map((c) => mc.perCandidate[c].ci95[1]);
  const domain = [Math.max(0, Math.min(0.45, Math.min(...lows) - 0.03)), Math.min(1, Math.max(0.55, Math.max(...highs) + 0.03))];

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <Panel title="Why is the model predicting this?" subtitle="Major drivers behind the projection" right={<Lightbulb size={16} className="text-term-warn" />}>
        <p className="text-sm text-term-text leading-relaxed">{explanation.summary}</p>
        <div className="mt-4 grid gap-2">
          {explanation.drivers.map((d, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-term-border bg-term-panel2 p-3">
              <div className="text-[10px] font-bold text-term-faint w-6 pt-0.5">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div className="text-xs font-semibold text-term-accent uppercase tracking-wide">{d.label}</div>
                <div className="text-sm text-term-muted mt-0.5">{d.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Monte Carlo */}
      <Panel
        title="Monte Carlo projection"
        subtitle={`${mc.iterations.toLocaleString()} simulations · seed ${mc.seed} · reproducible`}
        right={<Dice5 size={16} className="text-term-accent" />}
      >
        <div className="space-y-4">
          {MAJOR_CANDIDATE_IDS.map((cid) => {
            const s = mc.perCandidate[cid];
            const c = candidateById(cid);
            return (
              <div key={cid} className="rounded-lg border border-term-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
                    <span className="text-sm font-semibold text-term-text">{c.name}</span>
                    <Badge color={c.color}>{c.party}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs tnum">
                    <span className="text-term-muted">Proj. <b className="text-term-text">{pct(s.mean, 1)}</b></span>
                    <span className="text-term-muted">Win <b style={{ color: c.color }}>{pct(s.winProb, 0)}</b></span>
                    <span className="text-term-muted">Runoff-reach <b className="text-term-text">{pct(s.top2Prob, 0)}</b></span>
                  </div>
                </div>
                <div className="mt-2">
                  <CredibleIntervalBar candidateId={cid} stat={s} domain={domain} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-term-faint tnum mt-1">
                  <span>50%: {pct(s.ci50[0], 1)}–{pct(s.ci50[1], 1)}</span>
                  <span>80%: {pct(s.ci80[0], 1)}–{pct(s.ci80[1], 1)}</span>
                  <span>95%: {pct(s.ci95[0], 1)}–{pct(s.ci95[1], 1)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[11px] text-term-muted">
          Bars show projected final vote share: light = 95%, mid = 80%, dark = 50% credible interval; tick = median; thin vertical line = 50% threshold.
        </div>
      </Panel>

      {/* Runoff detection */}
      <Panel title="Runoff detection & threshold mathematics" subtitle="Zambia rule: >50% of valid votes required to avoid a runoff" right={<Target size={16} className="text-term-warn" />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatTile label="Projected valid total" value={num(race.totalValidProjected)} sub="expected final" />
          <StatTile label="Counted valid" value={num(race.countedValid)} sub={pct(agg.national.pctCounted, 0) + ' of expected'} />
          <StatTile label="Outstanding valid" value={num(race.outstandingValid)} sub="still available" tone="accent" />
          <StatTile label={`${candidateName(race.leader)} needs`} value={num(race.votesToWin)} sub="more votes for 50%+1" tone="warn" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge color={race.guaranteedOutright ? 'rgb(var(--term-good))' : undefined}>
            {race.guaranteedOutright ? '✓ Outright win mathematically secured' : 'Outright win not yet secured'}
          </Badge>
          <Badge color={race.leaderCannotBeCaught ? 'rgb(var(--term-good))' : undefined}>
            {race.leaderCannotBeCaught ? '✓ Leader cannot be caught for first' : 'Leader still catchable'}
          </Badge>
          <Badge color={race.runoffGuaranteed ? '#b78cff' : undefined}>
            {race.runoffGuaranteed ? '✓ Runoff mathematically guaranteed' : 'Runoff not guaranteed'}
          </Badge>
        </div>
      </Panel>

      {/* What the remaining vote needs */}
      <Panel title="What does the remaining vote need to look like?" subtitle="Share of the outstanding vote each candidate would need" right={<Split size={16} className="text-term-accent" />}>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-term-faint border-b border-term-border">
                <th className="py-2 pr-3">Candidate</th>
                <th className="py-2 px-3 text-right">Counted</th>
                <th className="py-2 px-3 text-right">Remaining share for &gt;50%</th>
                <th className="py-2 px-3 text-right">Remaining share to overtake leader</th>
                <th className="py-2 pl-3 text-right">Feasibility</th>
              </tr>
            </thead>
            <tbody>
              {race.required.map((r) => {
                const c = candidateById(r.cid);
                return (
                  <tr key={r.cid} className="border-b border-term-border/60 row-hover">
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm" style={{ background: c.color }} />
                        {c.name} {r.isLeader && <Badge>leader</Badge>}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tnum">{num(r.current)}</td>
                    <td className="py-2.5 px-3 text-right tnum">
                      {r.shareForOutright <= 0 ? <span className="text-term-good">already ≥50%</span> : r.shareForOutright > 1 ? <span className="text-term-bad">impossible</span> : pct(r.shareForOutright, 1)}
                    </td>
                    <td className="py-2.5 px-3 text-right tnum">
                      {r.isLeader ? <span className="text-term-faint">—</span> : r.shareToOvertake > 1 ? <span className="text-term-bad">impossible</span> : pct(r.shareToOvertake, 1)}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      {r.isLeader ? (
                        <Badge color="rgb(var(--term-good))">holding lead</Badge>
                      ) : r.overtakePossible ? (
                        <Badge color="rgb(var(--term-warn))">possible</Badge>
                      ) : (
                        <Badge color="rgb(var(--term-bad))">cannot catch</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-term-muted">
          “Remaining share to overtake” is the two-way split of the outstanding vote (candidate vs current leader) needed to finish first. “Remaining share for &gt;50%” is the share of ALL outstanding valid votes needed to cross the outright-win line.
        </p>
      </Panel>
    </div>
  );
}
