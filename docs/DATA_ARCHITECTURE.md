# Data-Source Architecture

## Design goal

New results can be added **without rebuilding the application**. The UI only ever talks to the **store selectors** and the **ingestion API** — it never reads hardcoded data. Swapping the in-browser store for a real database/service therefore requires **no UI changes**.

```
                    ┌─────────────────────────────────────────────┐
   Sources          │                 INGESTION                   │
 ─────────────      │                                             │
  ECZ (official) ─┐ │  ingestResult(input)                        │
  ECZ polling ────┤ │    → validate()  (flags + integrity score)  │
  News (verified)─┤ │    → classify   (official/verified/unverif.)│
  CSV / Excel ────┼─▶    → supersede prior active return          │
  Manual entry ───┤ │    → audit trail                            │
  Unverified ─────┘ │    → includedInModel? (trusted & clean)     │
                    └───────────────┬─────────────────────────────┘
                                    │
                         ┌──────────▼──────────┐    selectors
                         │        STORE        │─────────────────▶  UI screens
                         │  Results + AuditLog │
                         │  + Snapshots        │─────┐
                         └─────────────────────┘     │ aggregate()
                                                      ▼
                    ┌─────────────────────────────────────────────┐
                    │                  ENGINE                     │
                    │  aggregate → forecast → Monte Carlo → runoff │
                    │  (reproducible, seeded)                     │
                    └─────────────────────────────────────────────┘
```

## Pipeline (audit trail)

Every result flows through, and each transition is recorded in the **AuditLog**:

```
Source → received → validated → verified → included   (or → flagged / held / superseded)
```

- **Never silently overwritten.** A newer return for the same reporting unit + source marks the previous one `superseded` (retained and visible).
- **Trust is explicit.** Official/verified classes are included automatically *if clean*; unverified data and critically-flagged data are **held out of the model** but kept for review. Media reports are never merged into official figures.

## Current implementation vs production

| Concern | This MVP | Production target |
|---|---|---|
| Store | In-browser normalized store, localStorage (`src/data/store.js`) | PostgreSQL (see [SCHEMA.md](SCHEMA.md)) |
| Ingestion | `ingestResult()` JS function | `POST /results` on a FastAPI service ([API.md](API.md)) |
| Model | Client-side JS engine (`src/engine/`) | Python model service (FastAPI) running the same algorithm |
| Live updates | In-app events + demo "Advance" feed | Server-Sent Events / WebSockets |
| Map | Schematic tile cartogram (SVG/CSS) | Mapbox / GeoJSON constituencies |
| Auth | Open demo | JWT for admin/manual entry; API key for ingestion |

Because the engine functions are **pure** and take a results array, they can run unchanged either in the browser or inside a Python/JS worker behind the API. The ingestion contract (`input` shape) is identical to the manual-entry form and the CSV uploader.

## Entities

`Candidates · Parties · Provinces · Constituencies · PollingStations · Results · Sources · Verification · HistoricalResults · ForecastRuns · ModelOutputs · AuditLog` — see [SCHEMA.md](SCHEMA.md).
