import React, { useMemo, useState } from 'react';
import { Panel, Button, Badge, IntegrityChip, Eyebrow } from '../components/ui.jsx';
import { useStore, selectors, ingestResult } from '../data/store.js';
import { PROVINCES, constituenciesByProvince, constituencyById } from '../data/geography.js';
import { SOURCES } from '../data/sources.js';
import { CANDIDATES } from '../data/candidates.js';
import { validateResult } from '../engine/validation.js';
import { num } from '../lib/format.js';
import { Keyboard, CheckCircle2 } from 'lucide-react';

const blankVotes = () => ({ HH: '', BM: '', FM: '', OTH: '' });

export function ManualEntry() {
  const state = useStore();
  const [province, setProvince] = useState('LSK');
  const cons = constituenciesByProvince(province);
  const [constituencyId, setConstituencyId] = useState(cons[0]?.id);
  const [pollingStation, setPollingStation] = useState('');
  const [registered, setRegistered] = useState(constituencyById[cons[0]?.id]?.registeredVoters || 0);
  const [votes, setVotes] = useState(blankVotes());
  const [invalid, setInvalid] = useState('');
  const [sourceId, setSourceId] = useState('ECZ');
  const [isFinal, setIsFinal] = useState(true);
  const [justAdded, setJustAdded] = useState(null);

  const onProvince = (pid) => {
    setProvince(pid);
    const c = constituenciesByProvince(pid)[0];
    setConstituencyId(c.id);
    setRegistered(c.registeredVoters);
  };
  const onConstituency = (cid) => {
    setConstituencyId(cid);
    setRegistered(constituencyById[cid].registeredVoters);
  };

  const draft = useMemo(() => ({
    constituencyId,
    pollingStation: pollingStation || null,
    sourceId,
    votes: { HH: +votes.HH || 0, BM: +votes.BM || 0, FM: +votes.FM || 0, OTH: +votes.OTH || 0 },
    invalidVotes: +invalid || 0,
    registeredVoters: +registered || 0,
    final: isFinal
  }), [constituencyId, pollingStation, sourceId, votes, invalid, registered, isFinal]);

  const preview = validateResult(draft, selectors.activeResults(state));
  const anyVotes = draft.votes.HH + draft.votes.BM + draft.votes.FM + draft.votes.OTH > 0;

  const submit = () => {
    if (!anyVotes) return;
    const rec = ingestResult(draft, 'analyst-manual');
    setJustAdded(rec);
    setVotes(blankVotes());
    setInvalid('');
    setPollingStation('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Panel title="Manual result entry" subtitle="Authorised analyst desk — validated on submit" right={<Keyboard size={16} className="text-term-accent" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Province">
              <select value={province} onChange={(e) => onProvince(e.target.value)} className="input">
                {PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Constituency">
              <select value={constituencyId} onChange={(e) => onConstituency(e.target.value)} className="input">
                {cons.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Polling station (optional)">
              <input value={pollingStation} onChange={(e) => setPollingStation(e.target.value)} placeholder="e.g. Ward 7 Stream 3" className="input" />
            </Field>
            <Field label="Registered voters">
              <input type="number" value={registered} onChange={(e) => setRegistered(e.target.value)} className="input tnum" />
            </Field>
          </div>

          <Eyebrow className="mt-4 mb-2">Candidate votes</Eyebrow>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CANDIDATES.map((c) => (
              <Field key={c.id} label={<span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: c.color }} />{c.shortName}</span>}>
                <input type="number" value={votes[c.id]} onChange={(e) => setVotes((v) => ({ ...v, [c.id]: e.target.value }))} placeholder="0" className="input tnum" />
              </Field>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Field label="Invalid ballots">
              <input type="number" value={invalid} onChange={(e) => setInvalid(e.target.value)} placeholder="0" className="input tnum" />
            </Field>
            <Field label="Source">
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="input">
                {SOURCES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Return type">
              <label className="flex items-center gap-2 text-sm text-term-text h-[38px]">
                <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} /> Final (complete) count
              </label>
            </Field>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button variant="primary" onClick={submit} disabled={!anyVotes}><CheckCircle2 size={14} /> Validate & ingest</Button>
            {justAdded && <span className="text-xs text-term-good">Ingested {justAdded.id} · integrity {justAdded.integrityScore}{justAdded.includedInModel ? ' · in model' : ' · held for review'}</span>}
          </div>
        </Panel>
      </div>

      {/* Live validation preview */}
      <div>
        <Panel title="Live validation preview" subtitle="Runs before you submit">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-term-muted">Integrity score</span>
            <IntegrityChip score={preview.integrityScore} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat label="Votes cast" value={num(preview.votesCast)} />
            <Stat label="Turnout" value={`${(preview.turnout * 100).toFixed(1)}%`} tone={preview.turnout > 1 ? 'bad' : 'default'} />
          </div>
          {preview.flags.length === 0 ? (
            <div className="rounded-lg border border-term-good/30 bg-term-good/10 p-3 text-xs text-term-good">No anomalies detected. This return would be {SOURCES.find((s) => s.id === sourceId)?.type === 'official' || SOURCES.find((s) => s.id === sourceId)?.type === 'media' ? 'included in the model' : 'held pending verification'}.</div>
          ) : (
            <div className="space-y-1.5">
              {preview.flags.map((f, i) => (
                <div key={i} className="rounded-lg border p-2 text-[11px]" style={{ borderColor: (f.severity === 'critical' ? 'rgb(var(--term-bad))' : 'rgb(var(--term-warn))') + '55', color: f.severity === 'critical' ? 'rgb(var(--term-bad))' : 'rgb(var(--term-warn))' }}>
                  <Badge>{f.severity}</Badge> <span className="ml-1">{f.message}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <style>{`.input{width:100%;background:rgb(var(--term-panel2));border:1px solid rgb(var(--term-border));border-radius:8px;padding:8px 10px;font-size:13px;color:rgb(var(--term-text))}.input:focus{outline:2px solid rgb(var(--term-accent));outline-offset:-1px}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[11px] text-term-faint mb-1">{label}</div>
      {children}
    </label>
  );
}
function Stat({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-lg bg-term-panel2 p-2">
      <div className="text-[10px] text-term-faint">{label}</div>
      <div className={`text-sm font-semibold tnum ${tone === 'bad' ? 'text-term-bad' : 'text-term-text'}`}>{value}</div>
    </div>
  );
}
