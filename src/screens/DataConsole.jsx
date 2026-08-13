import React, { useState } from 'react';
import { Panel, Tabs, Badge, IntegrityChip, Button, Empty, Eyebrow } from '../components/ui.jsx';
import { useStore, selectors, setIncluded, verifyResult, setResultClass } from '../data/store.js';
import { constituencyById, provinceById } from '../data/geography.js';
import { sourceById, SOURCES, RESULT_CLASS, PIPELINE_STAGES } from '../data/sources.js';
import { candidateById, candidateName } from '../data/candidates.js';
import { num, pct, timeAgo, clockTime } from '../lib/format.js';
import { Database, ShieldAlert, ListTree, BookMarked, CheckCircle2, XCircle } from 'lucide-react';

const TABS = [
  { id: 'feed', label: 'Live feed' },
  { id: 'validation', label: 'Validation' },
  { id: 'audit', label: 'Audit trail' },
  { id: 'sources', label: 'Sources' }
];

function ClassBadge({ cls }) {
  const c = RESULT_CLASS[cls];
  return <Badge color={c.color}>{c.label}</Badge>;
}

function ResultRow({ r, showFlags }) {
  const con = constituencyById[r.constituencyId];
  const lead = ['HH', 'BM', 'FM', 'OTH'].sort((a, b) => (r.votes[b] || 0) - (r.votes[a] || 0))[0];
  const valid = ['HH', 'BM', 'FM', 'OTH'].reduce((a, k) => a + (r.votes[k] || 0), 0);
  return (
    <tr className="border-b border-term-border/50 align-top">
      <td className="py-2 pr-2">
        <div className="text-term-text">{con ? con.name : r.constituencyId}</div>
        <div className="text-[10px] text-term-faint">{con ? provinceById[con.provinceId].name : ''}{r.pollingStation ? ` · ${r.pollingStation}` : ''}</div>
      </td>
      <td className="py-2 px-2"><div className="text-term-muted text-xs">{sourceById[r.sourceId]?.name || r.sourceId}</div><ClassBadge cls={r.resultClass} /></td>
      <td className="py-2 px-2">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: candidateById(lead).color }} />{candidateName(lead)} {pct(valid ? r.votes[lead] / valid : 0, 0)}</span>
      </td>
      <td className="py-2 px-2 text-right tnum">{num(r.votesCast || 0)}</td>
      <td className="py-2 px-2 text-right tnum">{pct(r.turnout || 0, 0)}</td>
      <td className="py-2 px-2 text-right"><IntegrityChip score={r.integrityScore} /></td>
      <td className="py-2 px-2">
        {r.includedInModel ? <Badge color="rgb(var(--term-good))">in model</Badge> : <Badge color="rgb(var(--term-warn))">excluded</Badge>}
        {showFlags && r.flags?.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {r.flags.map((f, i) => (
              <div key={i} className="text-[10px]" style={{ color: f.severity === 'critical' ? 'rgb(var(--term-bad))' : f.severity === 'warning' ? 'rgb(var(--term-warn))' : 'rgb(var(--term-faint))' }}>• {f.message}</div>
            ))}
          </div>
        )}
      </td>
      <td className="py-2 pl-2 text-right whitespace-nowrap">
        <Button size="sm" variant="ghost" onClick={() => setIncluded(r.id, !r.includedInModel)}>{r.includedInModel ? <><XCircle size={12} /> exclude</> : <><CheckCircle2 size={12} /> include</>}</Button>
        {r.resultClass === 'unverified' && <Button size="sm" variant="ghost" onClick={() => verifyResult(r.id)}>verify</Button>}
      </td>
    </tr>
  );
}

export function DataConsole() {
  const state = useStore();
  const [tab, setTab] = useState('feed');
  const [filter, setFilter] = useState('all');
  const active = selectors.activeResults(state);
  const flagged = selectors.flaggedResults(state);
  const audit = selectors.auditLog(state);

  const filtered = filter === 'all' ? active : filter === 'flagged' ? active.filter((r) => r.flags?.length) : active.filter((r) => r.resultClass === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="text-xs text-term-muted tnum">{active.length} active results · {selectors.includedResults(state).length} in model · {flagged.length} flagged</div>
      </div>

      {tab === 'feed' && (
        <Panel title="Live result feed" subtitle="Every ingested result — source, class, integrity, model inclusion" right={<Database size={16} className="text-term-accent" />}>
          <div className="flex flex-wrap gap-1 mb-3">
            {['all', 'official', 'verified', 'unverified', 'flagged'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded text-xs ${filter === f ? 'bg-term-accent text-white' : 'bg-term-panel2 text-term-muted'}`}>{f}</button>
            ))}
          </div>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-term-faint border-b border-term-border">
                  <th className="py-2 pr-2">Constituency</th><th className="py-2 px-2">Source / class</th><th className="py-2 px-2">Leader</th>
                  <th className="py-2 px-2 text-right">Votes cast</th><th className="py-2 px-2 text-right">Turnout</th><th className="py-2 px-2 text-right">Integrity</th><th className="py-2 px-2">Model</th><th className="py-2 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => b.receivedAt - a.receivedAt).map((r) => <ResultRow key={r.id} r={r} showFlags={filter === 'flagged'} />)}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'validation' && (
        <Panel title="Data integrity & anomaly detection" subtitle="Flagged results are held, never deleted — review and decide" right={<ShieldAlert size={16} className="text-term-warn" />}>
          {flagged.length === 0 ? <Empty>No flagged results.</Empty> : (
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-term-faint border-b border-term-border">
                    <th className="py-2 pr-2">Constituency</th><th className="py-2 px-2">Source / class</th><th className="py-2 px-2">Leader</th>
                    <th className="py-2 px-2 text-right">Votes cast</th><th className="py-2 px-2 text-right">Turnout</th><th className="py-2 px-2 text-right">Integrity</th><th className="py-2 px-2">Flags & model</th><th className="py-2 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>{flagged.sort((a, b) => a.integrityScore - b.integrityScore).map((r) => <ResultRow key={r.id} r={r} showFlags />)}</tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-[11px] text-term-muted">
            Rules flag: votes &gt; registered, turnout &gt; 100%, single candidate &gt; register, duplicates, source conflicts, near-unanimous results, large swings vs 2021, and identical patterns. Integrity = 100 − penalties. Critical flags auto-exclude from the model pending review.
          </div>
        </Panel>
      )}

      {tab === 'audit' && (
        <Panel title="Audit trail" subtitle="Source → received → validated → verified → included" right={<ListTree size={16} className="text-term-accent" />}>
          <div className="flex flex-wrap gap-2 mb-3">
            {PIPELINE_STAGES.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1 text-[11px] text-term-muted">
                {i > 0 && <span className="text-term-faint">→</span>}
                <Badge>{s}</Badge>
              </span>
            ))}
          </div>
          <div className="max-h-[28rem] overflow-y-auto scroll-thin space-y-1">
            {audit.slice(0, 200).map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-xs border-b border-term-border/40 py-1.5">
                <span className="text-term-faint tnum w-16 shrink-0">{clockTime(a.at)}</span>
                <Badge>{a.action}</Badge>
                <span className="text-term-muted flex-1">{a.detail}</span>
                <span className="text-term-faint shrink-0">{a.actor}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'sources' && <SourcesTab active={active} />}
    </div>
  );
}

function SourcesTab({ active }) {
  const byId = {};
  for (const r of active) {
    (byId[r.sourceId] = byId[r.sourceId] || { total: 0, included: 0 }).total++;
    if (r.includedInModel) byId[r.sourceId].included++;
  }
  const latest = active.slice().sort((a, b) => b.receivedAt - a.receivedAt)[0];
  return (
    <div className="space-y-4">
      <Panel title="Data-source transparency" subtitle="Every number is traceable to its source" right={<BookMarked size={16} className="text-term-accent" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SOURCES.map((s) => {
            const c = byId[s.id] || { total: 0, included: 0 };
            return (
              <div key={s.id} className="rounded-lg border border-term-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-term-text">{s.name}</span>
                  <Badge color={s.type === 'official' ? 'rgb(var(--term-good))' : s.type === 'media' ? '#5eb3ff' : s.type === 'unverified' ? 'rgb(var(--term-warn))' : undefined}>{s.type}</Badge>
                </div>
                <div className="text-[11px] text-term-muted mt-1">{s.description}</div>
                <div className="text-xs text-term-faint mt-2 tnum">{c.total} results · {c.included} in model · tier {s.tier}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Classification legend">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.values(RESULT_CLASS).map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg border border-term-border p-2 text-xs">
              <span className="w-3 h-3 rounded-sm" style={{ background: c.color }} />
              <span className="text-term-text font-medium">{c.label}</span>
              <span className="text-term-faint ml-auto">{c.trusted ? 'trusted' : c.id === 'model' || c.id === 'projected' ? 'engine output' : 'held'}</span>
            </div>
          ))}
        </div>
      </Panel>

      {latest && (
        <Panel title="Traceability example" subtitle="Newest included return">
          <TraceCard r={latest} />
        </Panel>
      )}
    </div>
  );
}

function TraceCard({ r }) {
  const con = constituencyById[r.constituencyId];
  const rows = [
    ['Constituency', con ? `${con.name} (${provinceById[con.provinceId].name})` : r.constituencyId],
    ['Source', sourceById[r.sourceId]?.name || r.sourceId],
    ['Class', RESULT_CLASS[r.resultClass].label],
    ['Received', `${clockTime(r.receivedAt)} · ${timeAgo(r.receivedAt)}`],
    ['Integrity score', `${r.integrityScore}/100`],
    ['Verified', r.resultClass === 'unverified' ? 'No' : 'Yes'],
    ['Included in model', r.includedInModel ? 'Yes' : 'No']
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-term-border/40 py-1">
          <span className="text-term-faint">{k}</span><span className="text-term-text text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}
