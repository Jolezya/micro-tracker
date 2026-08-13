// =============================================================================
//  STORE  —  the in-browser "database"
// -----------------------------------------------------------------------------
//  Holds Results, an AuditLog, and derived selectors. Designed so new results
//  are ADDED, never silently overwritten: a newer return for the same unit marks
//  the previous one `superseded` (retained, visible) and records the transition
//  in the audit trail:  Source -> received -> validated -> verified -> included.
//
//  Persistence is localStorage (swap `persist`/`load` for a real API/Postgres
//  layer to go to production — the rest of the app only talks to selectors).
// =============================================================================

import { useSyncExternalStore } from 'react';
import { validateResult, hasCritical } from '../engine/validation.js';
import { defaultClassForSource, RESULT_CLASS } from './sources.js';
import { generateDemoResults, simulateResult } from './demoResults.js';
import { constituencyById, CONSTITUENCIES } from './geography.js';
import { aggregate } from '../engine/aggregate.js';

const STORAGE_KEY = 'zm-election-store-v2';

let state = { results: [], auditLog: [], seq: 0, snapshots: [], loadedAt: Date.now() };
const listeners = new Set();

function emit() {
  // new object identities so useSyncExternalStore detects the change
  state = { ...state };
  for (const l of listeners) l();
  persist();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ results: state.results, auditLog: state.auditLog, seq: state.seq, snapshots: state.snapshots }));
  } catch (e) {
    /* storage may be unavailable (private mode) — the app still works in-memory */
  }
}

function nextId(prefix) {
  state.seq += 1;
  return `${prefix}-${state.seq}`;
}

function audit(resultId, action, detail, actor = 'system') {
  state.auditLog.unshift({
    id: nextId('a'),
    at: Date.now(),
    resultId,
    action,
    detail,
    actor
  });
}

function activeResults() {
  return state.results.filter((r) => r.status === 'active');
}

// -----------------------------------------------------------------------------
//  Ingestion
// -----------------------------------------------------------------------------
/**
 * Ingest a result. Runs validation, assigns a class, records the audit trail,
 * and supersedes any prior active result for the same reporting unit.
 * @param {object} input  { constituencyId, pollingStation?, sourceId, votes,
 *                          invalidVotes, registeredVoters?, final?, receivedAt?,
 *                          resultClass?, note? }
 * @param {string} actor  who performed the action (for the audit log)
 * @returns {object} the stored record
 */
export function ingestResult(input, actor = 'system') {
  const con = constituencyById[input.constituencyId];
  const resultClass = input.resultClass || defaultClassForSource(input.sourceId);
  const rec = {
    id: nextId('r'),
    constituencyId: input.constituencyId,
    provinceId: con ? con.provinceId : input.provinceId || null,
    pollingStation: input.pollingStation || null,
    sourceId: input.sourceId,
    resultClass,
    votes: {
      HH: Number(input.votes.HH) || 0,
      BM: Number(input.votes.BM) || 0,
      FM: Number(input.votes.FM) || 0,
      OTH: Number(input.votes.OTH) || 0
    },
    invalidVotes: Number(input.invalidVotes) || 0,
    registeredVoters: Number(input.registeredVoters) || (con ? con.registeredVoters : 0),
    final: input.final !== undefined ? !!input.final : true,
    receivedAt: input.receivedAt || Date.now(),
    note: input.note || '',
    status: 'active',
    stage: 'received',
    supersedes: null
  };

  const { flags, integrityScore, votesCast, turnout } = validateResult(rec, activeResults());
  rec.flags = flags;
  rec.integrityScore = integrityScore;
  rec.votesCast = votesCast;
  rec.turnout = turnout;
  rec.stage = 'validated';

  const critical = hasCritical(flags);
  const trusted = RESULT_CLASS[resultClass]?.trusted;
  // Trusted-class, clean results are verified & included automatically; anything
  // unverified or carrying a critical flag stays out of the model pending review.
  rec.includedInModel = !!trusted && !critical;
  rec.stage = rec.includedInModel ? 'included' : critical ? 'flagged' : trusted ? 'verified' : 'received';

  // Supersede prior active result for the same unit.
  const prior = activeResults().find(
    (r) => r.constituencyId === rec.constituencyId && (r.pollingStation || null) === (rec.pollingStation || null) && r.sourceId === rec.sourceId
  );
  if (prior) {
    prior.status = 'superseded';
    rec.supersedes = prior.id;
    audit(prior.id, 'superseded', `Superseded by newer return ${rec.id} from ${rec.sourceId}.`, actor);
  }

  state.results = [rec, ...state.results];
  audit(rec.id, 'received', `Received ${resultClass} return for ${con ? con.name : rec.constituencyId} from ${rec.sourceId}.`, actor);
  audit(rec.id, 'validated', flags.length ? `Validated with ${flags.length} flag(s); integrity ${integrityScore}.` : `Validated clean; integrity ${integrityScore}.`, actor);
  if (rec.includedInModel) audit(rec.id, 'included', 'Trusted & clean — included in model.', actor);
  else if (critical) audit(rec.id, 'flagged', 'Critical integrity flag — held out of model pending review.', actor);
  else if (!trusted) audit(rec.id, 'held', 'Unverified class — excluded from model until verified.', actor);

  emit();
  return rec;
}

export function setIncluded(resultId, included, actor = 'analyst') {
  const r = state.results.find((x) => x.id === resultId);
  if (!r) return;
  r.includedInModel = included;
  r.stage = included ? 'included' : 'verified';
  audit(resultId, included ? 'included' : 'excluded', included ? 'Manually included in model.' : 'Manually excluded from model.', actor);
  emit();
}

export function setResultClass(resultId, cls, actor = 'analyst') {
  const r = state.results.find((x) => x.id === resultId);
  if (!r) return;
  r.resultClass = cls;
  audit(resultId, 'reclassified', `Reclassified as ${RESULT_CLASS[cls]?.label || cls}.`, actor);
  emit();
}

export function verifyResult(resultId, actor = 'analyst') {
  const r = state.results.find((x) => x.id === resultId);
  if (!r) return;
  if (r.resultClass === 'unverified') r.resultClass = 'verified';
  r.stage = 'verified';
  audit(resultId, 'verified', 'Marked verified by analyst.', actor);
  emit();
}

// -----------------------------------------------------------------------------
//  Snapshots (for change-since-last-update deltas and the live timeline)
// -----------------------------------------------------------------------------
export function recordSnapshot(label = 'Update') {
  const agg = aggregate(state.results);
  state.snapshots.push({
    id: nextId('s'),
    at: Date.now(),
    label,
    shares: agg.national.shares,
    counted: agg.national.counted,
    leader: agg.national.leader,
    countedCast: agg.national.countedCast,
    pctCounted: agg.national.pctCounted,
    constituenciesReported: agg.national.constituenciesReported
  });
  // keep the log bounded
  if (state.snapshots.length > 60) state.snapshots = state.snapshots.slice(-60);
}

/** Latest national snapshot before the current one (for deltas). */
export function previousSnapshot() {
  const s = state.snapshots;
  return s.length >= 2 ? s[s.length - 2] : null;
}

/**
 * Simulate a batch of newly-reporting constituencies (demo live feed). Picks
 * currently-unreported units and ingests final returns, then records a snapshot.
 */
export function advanceCount(n = 3, actor = 'demo-feed') {
  const agg = aggregate(state.results);
  const unreported = CONSTITUENCIES.filter((c) => !agg.byConstituency[c.id].hasData);
  if (!unreported.length) return 0;
  // deterministic-ish rotation so repeated clicks reveal different areas
  const start = (state.snapshots.length * 3) % unreported.length;
  const salt = Date.now();
  const picks = [];
  for (let i = 0; i < Math.min(n, unreported.length); i++) picks.push(unreported[(start + i) % unreported.length]);
  const seen = new Set();
  for (const con of picks) {
    if (seen.has(con.id)) continue;
    seen.add(con.id);
    ingestResult(simulateResult(con, salt, salt + con.id.length), actor);
  }
  recordSnapshot(`+${seen.size} constituencies reported`);
  emit();
  return seen.size;
}

// -----------------------------------------------------------------------------
//  Lifecycle
// -----------------------------------------------------------------------------
export function resetToDemo() {
  state = { results: [], auditLog: [], seq: 0, snapshots: [], loadedAt: Date.now() };
  const inputs = generateDemoResults(Date.now());
  for (const i of inputs) ingestResult(i, 'demo-seed');
  recordSnapshot('Initial count snapshot');
  emit();
}

export function clearAll() {
  state = { results: [], auditLog: [], seq: 0, snapshots: [], loadedAt: Date.now() };
  recordSnapshot('Cleared — awaiting results');
  emit();
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.results) && parsed.results.length) {
        state = { results: parsed.results, auditLog: parsed.auditLog || [], seq: parsed.seq || 0, snapshots: parsed.snapshots || [], loadedAt: Date.now() };
        if (!state.snapshots.length) recordSnapshot('Restored session');
        return;
      }
    }
  } catch (e) {
    /* fall through to demo seed */
  }
  resetToDemo();
}
load();

// -----------------------------------------------------------------------------
//  React binding + selectors
// -----------------------------------------------------------------------------
function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function getState() {
  return state;
}
export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export const selectors = {
  activeResults: (s) => s.results.filter((r) => r.status === 'active'),
  includedResults: (s) => s.results.filter((r) => r.status === 'active' && r.includedInModel),
  allResults: (s) => s.results,
  auditLog: (s) => s.auditLog,
  snapshots: (s) => s.snapshots || [],
  flaggedResults: (s) => s.results.filter((r) => r.status === 'active' && r.flags && r.flags.length)
};
