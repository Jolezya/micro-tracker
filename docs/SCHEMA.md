# Database Schema

The MVP implements this schema as an in-browser normalized store (`src/data/`). Below is the equivalent **PostgreSQL** schema for production. Types are illustrative.

```sql
-- Reference data ------------------------------------------------------------
CREATE TABLE parties (
  id            TEXT PRIMARY KEY,           -- 'UPND', 'PF', 'SP', 'IND'
  name          TEXT NOT NULL,
  color         TEXT NOT NULL
);

CREATE TABLE candidates (
  id            TEXT PRIMARY KEY,           -- 'HH', 'BM', ...
  name          TEXT NOT NULL,
  short_name    TEXT NOT NULL,
  party_id      TEXT REFERENCES parties(id),
  incumbent     BOOLEAN DEFAULT FALSE,
  historical_key TEXT                        -- party whose 2021 result is the prior
);

CREATE TABLE provinces (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  registered_voters INTEGER NOT NULL,
  expected_turnout  NUMERIC NOT NULL
);

CREATE TABLE constituencies (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  province_id       TEXT REFERENCES provinces(id),
  registered_voters INTEGER NOT NULL,
  expected_turnout  NUMERIC NOT NULL
);

CREATE TABLE polling_stations (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  constituency_id   TEXT REFERENCES constituencies(id),
  registered_voters INTEGER
);

-- Historical results (per election, per province/constituency or national) ---
CREATE TABLE historical_results (
  id            BIGSERIAL PRIMARY KEY,
  year          INTEGER NOT NULL,
  scope         TEXT NOT NULL,              -- 'national' | 'province' | 'constituency'
  scope_id      TEXT,                       -- province/constituency id (null for national)
  party_id      TEXT REFERENCES parties(id),
  share         NUMERIC,
  votes         INTEGER
);

-- Sources & classification ---------------------------------------------------
CREATE TABLE sources (
  id            TEXT PRIMARY KEY,           -- 'ECZ', 'NEWS-REUTERS', 'MANUAL', ...
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,              -- official|media|upload|manual|unverified
  tier          INTEGER NOT NULL
);

-- Results (the append-only heart of the system) ------------------------------
CREATE TABLE results (
  id                TEXT PRIMARY KEY,
  constituency_id   TEXT REFERENCES constituencies(id),
  polling_station   TEXT,                   -- nullable
  source_id         TEXT REFERENCES sources(id),
  result_class      TEXT NOT NULL,          -- official|verified|unverified
  votes             JSONB NOT NULL,         -- {"HH":n,"BM":n,"FM":n,"OTH":n}
  invalid_votes     INTEGER DEFAULT 0,
  registered_voters INTEGER,
  is_final          BOOLEAN DEFAULT TRUE,
  received_at       TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL,          -- active | superseded | rejected
  supersedes        TEXT REFERENCES results(id),
  integrity_score   INTEGER,                -- 0..100
  included_in_model BOOLEAN DEFAULT FALSE,
  note              TEXT
);
CREATE INDEX ON results (constituency_id, status);

-- Verification / integrity flags per result ----------------------------------
CREATE TABLE result_flags (
  id            BIGSERIAL PRIMARY KEY,
  result_id     TEXT REFERENCES results(id),
  code          TEXT NOT NULL,              -- 'turnout_over_100', 'duplicate', ...
  severity      TEXT NOT NULL,              -- critical | warning | info
  message       TEXT NOT NULL
);

-- Immutable audit trail ------------------------------------------------------
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  at            TIMESTAMPTZ NOT NULL,
  result_id     TEXT,
  action        TEXT NOT NULL,             -- received|validated|verified|included|excluded|superseded|flagged|reclassified
  detail        TEXT,
  actor         TEXT
);

-- Model provenance (reproducibility) -----------------------------------------
CREATE TABLE forecast_runs (
  id            BIGSERIAL PRIMARY KEY,
  ran_at        TIMESTAMPTZ NOT NULL,
  seed          BIGINT NOT NULL,
  iterations    INTEGER NOT NULL,
  scenario      JSONB,                      -- scenario overrides, if any
  included_hash TEXT                        -- hash of the included result set
);

CREATE TABLE model_outputs (
  id            BIGSERIAL PRIMARY KEY,
  run_id        BIGINT REFERENCES forecast_runs(id),
  candidate_id  TEXT REFERENCES candidates(id),
  projected_share NUMERIC,
  win_prob      NUMERIC,
  ci50_lo NUMERIC, ci50_hi NUMERIC,
  ci80_lo NUMERIC, ci80_hi NUMERIC,
  ci95_lo NUMERIC, ci95_hi NUMERIC
);
```

## Mapping to the MVP store

| Table | MVP location |
|---|---|
| parties, candidates | `src/data/candidates.js` |
| provinces, constituencies, polling_stations | `src/data/geography.js` |
| historical_results | `src/data/historical.js` + `geography.js` `hist2021` |
| sources | `src/data/sources.js` |
| results, result_flags, audit_log | `src/data/store.js` |
| forecast_runs, model_outputs | produced on the fly by `src/engine/pipeline.js` |
