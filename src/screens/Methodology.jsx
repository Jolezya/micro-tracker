import React from 'react';
import { Panel, Badge } from '../components/ui.jsx';
import { BookOpen, ShieldCheck, Database, GitBranch } from 'lucide-react';
import { TOTAL_REGISTERED, TOTAL_EXPECTED_VOTES, CONSTITUENCIES } from '../data/geography.js';
import { num } from '../lib/format.js';

const RULES = [
  'Never invent election results.',
  'Never present model estimates as official results.',
  'Never claim a candidate has won without sufficient evidence.',
  'Never hide uncertainty.',
  'Never treat social-media claims as verified results.',
  'Never auto-trust a single source.',
  'Never extrapolate national results naively from early reporting.',
  'Never manipulate probabilities to favour any candidate.'
];

export function Methodology() {
  return (
    <div className="space-y-4">
      <Panel title="Forecasting methodology" subtitle="How the projection and probabilities are produced" right={<BookOpen size={16} className="text-term-accent" />}>
        <div className="space-y-3 text-sm text-term-muted leading-relaxed">
          <Step n="1" title="Aggregate counted votes">
            Only <b className="text-term-text">active, included</b> results are tallied (constituency and polling-station level). Unverified or critically-flagged data is excluded but retained and visible.
          </Step>
          <Step n="2" title="Estimate the swing vs 2021">
            A turnout-weighted swing is computed from areas that have <i>already</i> reported, comparing their current shares to their 2021 pattern.
          </Step>
          <Step n="3" title="Project the outstanding vote (bias-corrected)">
            Each unreported area is projected from <b className="text-term-text">its own 2021 pattern + the estimated swing</b>, blended with any partial count it has. Because PF-leaning provinces keep their PF priors, the model self-corrects for UPND-leaning areas reporting first. The national reported share is never extrapolated to the whole country.
          </Step>
          <Step n="4" title="Monte Carlo simulation">
            Thousands of seeded simulations draw a correlated national swing plus independent per-area noise (both shrink as more reports in; final results contribute zero uncertainty). Each run produces national totals and a winner, giving win probabilities and 50/80/95% credible intervals.
          </Step>
          <Step n="5" title="Runoff mathematics">
            Zambia requires &gt;50% to win in round one. The engine tracks whether the leader has mathematically secured &gt;50%, whether they can still be caught, and whether a runoff is arithmetically guaranteed — using worst/best-case bounds on the outstanding vote.
          </Step>
        </div>
      </Panel>

      <Panel title="Critical rules" subtitle="Guarantees the application enforces" right={<ShieldCheck size={16} className="text-term-good" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RULES.map((r) => (
            <div key={r} className="flex items-start gap-2 text-sm text-term-muted">
              <span className="text-term-good mt-0.5">✓</span> {r}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-term-muted">Every projection is reproducible: the same included result set + seed + iteration count always yields identical numbers.</p>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Data architecture" subtitle="Normalized entities" right={<Database size={16} className="text-term-accent" />}>
          <div className="flex flex-wrap gap-1.5">
            {['Candidates', 'Parties', 'Provinces', 'Constituencies', 'PollingStations', 'Results', 'Sources', 'Verification', 'HistoricalResults', 'ForecastRuns', 'ModelOutputs', 'AuditLog'].map((e) => (
              <Badge key={e}>{e}</Badge>
            ))}
          </div>
          <p className="mt-3 text-sm text-term-muted">
            The store is an in-browser normalized database (localStorage-persisted). New results are <b className="text-term-text">added, never overwritten</b>; a newer return supersedes the prior one with a full audit trail. Swapping the persistence layer for PostgreSQL/FastAPI requires no UI changes — the app only talks to selectors.
          </p>
        </Panel>

        <Panel title="Replacing demo data with real ECZ results" subtitle="Production path" right={<GitBranch size={16} className="text-term-warn" />}>
          <ol className="text-sm text-term-muted space-y-2 list-decimal list-inside">
            <li>Disable the demo seed (or clear results in the Data console).</li>
            <li>Feed verified ECZ returns through the same ingestion API used by manual entry / uploads.</li>
            <li>Update registered-voter and 2021 priors in <code className="text-term-accent">geography.js</code> with official figures.</li>
            <li>Keep unofficial/media returns classed as <i>verified</i> or <i>unverified</i> — never <i>official</i>.</li>
          </ol>
          <p className="mt-3 text-[11px] text-term-muted">See <code className="text-term-accent">docs/METHODOLOGY.md</code>, <code className="text-term-accent">docs/API.md</code> and <code className="text-term-accent">docs/DATA_ARCHITECTURE.md</code>.</p>
        </Panel>
      </div>

      <Panel title="Demo dataset scale">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Constituencies modelled" value={num(CONSTITUENCIES.length)} />
          <Metric label="Registered voters (demo)" value={num(TOTAL_REGISTERED)} />
          <Metric label="Expected votes (demo)" value={num(TOTAL_EXPECTED_VOTES)} />
        </div>
        <p className="mt-3 text-center text-[11px] text-term-warn">DEMO DATA — NOT ACTUAL ELECTION RESULTS.</p>
      </Panel>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-term-accent/15 text-term-accent flex items-center justify-center text-xs font-bold">{n}</div>
      <div><div className="text-term-text font-medium text-sm">{title}</div><div className="text-sm">{children}</div></div>
    </div>
  );
}
function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-term-border bg-term-panel2 p-3">
      <div className="text-lg font-bold tnum text-term-text">{value}</div>
      <div className="text-[10px] text-term-faint uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}
