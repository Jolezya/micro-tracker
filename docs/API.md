# Ingestion & Model API

In the MVP these operations are **JavaScript functions** in `src/data/store.js` and `src/engine/pipeline.js`. This document specifies both the in-app contract and the equivalent **HTTP API** for a production FastAPI service. The `input` shapes are identical, so the manual-entry form, CSV uploader, and a REST client all speak the same language.

## In-app functions (current)

```js
import { ingestResult, setIncluded, verifyResult, setResultClass,
         advanceCount, resetToDemo, clearAll, useStore, selectors } from './data/store.js';
import { computeForecast, useForecast } from './engine/pipeline.js';

// Ingest one result (validated, classified, audited, supersedes prior)
const rec = ingestResult({
  constituencyId: 'LSK-01',
  pollingStation: null,             // optional
  sourceId: 'ECZ',                  // sources.js id
  votes: { HH: 12000, BM: 8000, FM: 300, OTH: 120 },
  invalidVotes: 210,
  registeredVoters: 95000,          // optional (defaults from geography)
  final: true,
  resultClass: 'official',          // optional (defaults from source type)
  receivedAt: Date.now()            // optional
}, 'analyst-name');

// Run the whole model (reproducible)
const f = computeForecast(selectors.allResults(useStore.getState?.() ?? {}),
                          { scenario: {}, iterations: 4000, seed: 20260813 });
// f = { agg, model, point, mc, race, explanation, outstanding, swing }
```

## HTTP API (production target — FastAPI)

### `POST /results` — ingest a result
Auth: `X-Ingest-Key` (or JWT for manual entry).

```json
{
  "constituencyId": "LSK-01",
  "pollingStation": null,
  "sourceId": "ECZ",
  "votes": { "HH": 12000, "BM": 8000, "FM": 300, "OTH": 120 },
  "invalidVotes": 210,
  "registeredVoters": 95000,
  "final": true,
  "resultClass": "official",
  "receivedAt": "2026-08-13T20:41:00Z"
}
```
**201** →
```json
{
  "id": "r-123",
  "status": "active",
  "resultClass": "official",
  "integrityScore": 100,
  "flags": [],
  "includedInModel": true,
  "supersedes": null
}
```

### `POST /results/bulk` — CSV/Excel upload
`multipart/form-data` with a `file` field (columns: `constituency, polling_station, source, registered, HH, BM, FM, OTH, invalid, final`). Returns per-row ingest results and validation flags. Bulk uploads default to `verified`/`unverified` and are **not** auto-included until verified.

### `PATCH /results/{id}` — analyst actions
```json
{ "includedInModel": true }      // or { "resultClass": "verified" } / { "verified": true }
```

### `GET /results?status=active&class=official` — list results
### `GET /audit?limit=200` — audit trail
### `GET /sources` — source registry & classification legend

### `GET /forecast?iterations=4000&seed=20260813` — run the model
Optional `scenario` (JSON) for what-ifs. Returns:
```json
{
  "national": { "sharesCounted": {...}, "pctCounted": 0.51 },
  "projection": { "shares": {"HH":0.523,"BM":0.44,...}, "leader": "HH", "margin": 0.083 },
  "monteCarlo": {
    "iterations": 4000, "seed": 20260813, "runoffProb": 0.129,
    "perCandidate": { "HH": { "winProb": 0.87, "mean": 0.523,
      "ci50": [0.509,0.537], "ci80": [0.498,0.548], "ci95": [0.483,0.561] } }
  },
  "race": { "status": "LEANING HICHILEMA", "guaranteedOutright": false,
            "runoffGuaranteed": false, "votesToWin": 955925 },
  "explanation": { "summary": "...", "drivers": [ ... ] }
}
```

### `GET /stream` — live updates
Server-Sent Events (or WebSocket at `/ws`). Emits `result` events on ingest and `forecast` events when a meaningful new result triggers a re-run.

## Reproducibility contract

Given the same **included result set**, **seed**, and **iterations**, `/forecast` MUST return identical numbers. `forecast_runs` records `seed`, `iterations`, `scenario`, and a hash of the included set for every run.
