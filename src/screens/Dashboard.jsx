import React from 'react';
import { Panel, StatTile, Eyebrow, Badge } from '../components/ui.jsx';
import { CandidateCard } from '../components/CandidateCard.jsx';
import { VoteShareBar, CandidateLegend } from '../components/charts.jsx';
import { RaceStatus } from '../components/RaceStatus.jsx';
import { useStore, selectors } from '../data/store.js';
import { candidateName } from '../data/candidates.js';
import { num, pct, compact, timeAgo } from '../lib/format.js';
import { CheckCircle2, Clock, MapPin, Vote, TrendingUp, Flag } from 'lucide-react';

function confidenceOf(winProb, reported) {
  if (reported < 0.08) return { label: 'Very low — too early', tone: 'faint' };
  if (winProb > 0.9) return { label: 'High', tone: 'good' };
  if (winProb > 0.7) return { label: 'Moderate', tone: 'accent' };
  if (winProb > 0.55) return { label: 'Low', tone: 'warn' };
  return { label: 'Toss-up', tone: 'warn' };
}

export function Dashboard({ forecast, onNavigate }) {
  const state = useStore();
  const snaps = selectors.snapshots(state);
  const prevShares = snaps.length >= 2 ? snaps[snaps.length - 2].shares : null;
  const lastUpdate = state.results.reduce((m, r) => Math.max(m, r.receivedAt || 0), 0);

  const { agg, point, mc, race } = forecast;
  const leader = race.leader;
  const conf = confidenceOf(mc.perCandidate[leader].winProb, agg.national.pctCounted);
  const order = point.order.filter((c) => ['HH', 'BM', 'FM', 'OTH'].includes(c));

  return (
    <div className="space-y-4">
      {/* Status strip */}
      <Panel
        title="Zambia Presidential Election 2026"
        subtitle="Live results & projection — command centre"
        right={
          <div className="flex items-center gap-2 text-xs">
            <span className="live-dot inline-block w-2 h-2 rounded-full bg-term-good" />
            <span className="text-term-muted">Counting in progress</span>
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
          <StatTile icon={MapPin} label="Reporting units" value={`${agg.national.constituenciesReported}/${agg.national.constituenciesTotal}`} sub="constituencies" />
          <StatTile icon={CheckCircle2} label="% of expected vote" value={pct(agg.national.pctCounted, 1)} sub="counted" tone="accent" />
          <StatTile icon={Vote} label="Votes counted" value={compact(agg.national.countedCast)} sub={`${num(agg.national.countedCast)}`} />
          <StatTile icon={Flag} label="Leading now" value={candidateName(leader)} sub={pct(agg.national.shares[leader], 1)} />
          <StatTile icon={TrendingUp} label="Projected winner" value={race.statusClass === 'runoff' ? 'Runoff' : candidateName(point.leader)} sub={race.statusClass === 'confirmed' ? 'confirmed' : 'model'} tone="good" />
          <StatTile label="Confidence" value={conf.label} tone={conf.tone} />
          <StatTile icon={Clock} label="Last update" value={lastUpdate ? timeAgo(lastUpdate) : '—'} sub="newest return" />
        </div>
        <div className="mt-3 rounded-lg border border-term-warn/30 bg-term-warn/10 px-3 py-2 text-[11px] text-term-warn">
          Counted figures are actual tallies from included results. “Projected” and “win probability” are <strong>model estimates</strong>, not official results.
        </div>
      </Panel>

      {/* Race status */}
      <RaceStatus race={race} mc={mc} onNavigate={onNavigate} />

      {/* National share bar */}
      <Panel title="National vote share" subtitle="Counted votes only — 50% threshold marked" right={<CandidateLegend />}>
        <VoteShareBar shares={agg.national.shares} height={16} showThreshold />
        <div className="flex justify-between mt-2 text-xs text-term-muted">
          <span>0%</span>
          <span className="text-term-text font-medium">50% — outright-win threshold</span>
          <span>100%</span>
        </div>
      </Panel>

      {/* Candidate cards */}
      <div>
        <Eyebrow className="mb-2">Candidates</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {order.map((cid, i) => (
            <CandidateCard key={cid} cid={cid} agg={agg} point={point} mc={mc} prevShares={prevShares} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
