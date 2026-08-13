# Replacing Demo Data with Real ECZ Results

The app ships with **clearly labelled simulated data** so it can be demonstrated before real results exist. Everything simulated is marked **DEMO DATA — NOT ACTUAL ELECTION RESULTS**. Here is how to move to real data.

## 1. Update the reference data (priors)

Edit `src/data/geography.js`:

- Replace each province's `registeredVoters` and `expectedTurnout` with **official ECZ figures**.
- Replace `hist2021` with the **real 2021 provincial vote shares** (keyed `{ HH, BM, FM, OTH }` via the `historicalKey` mapping in `candidates.js`). For best accuracy, extend to **constituency-level** 2021 shares rather than the demo's jittered approximation.

Edit `src/data/candidates.js` to reflect the **actual 2026 candidate slate** and party mapping.

`src/data/historical.js` already contains real, rounded 2011–2021 national results; refine if you have exact figures.

## 2. Turn off the demo seed

The store seeds demo data on first load (`resetToDemo()` in `src/data/store.js`). For real use:

- **Clear** existing results in **Live Data & Audit** (or call `clearAll()`), then ingest real returns; **or**
- Remove/guard the demo seed so the store starts empty and waits for real ingestion. In `store.js`, replace the fallback `resetToDemo()` in `load()` with `clearAll()`.
- Remove the demo "Advance"/"Auto-play" controls (Election Night header and the top bar) if you don't want a synthetic feed.
- Delete the DEMO banner in `src/App.jsx` **only once no simulated data remains**.

## 3. Feed real returns through the same ingestion path

Real returns use the exact contract in [API.md](API.md) — the same one used by Manual Entry and CSV upload:

- **Official ECZ returns** → `sourceId: 'ECZ'` (or `'ECZ-PS'` for polling stations), which classes them **official** and includes them when clean.
- **Reputable news tabulations** → a media source id → classed **verified**.
- **Anything unverified** (field/social) → `'SOCIAL'` → classed **unverified**, held out of the model. Never class media or social reports as `official`.

To connect a live feed, set `VITE_API_BASE_URL` / `VITE_LIVE_FEED_URL` (see `.env.example`) and point the store's `ingestResult`/persistence at your FastAPI + PostgreSQL backend. Because the UI only uses selectors and the ingestion function, no screen code changes.

## 4. Tune the model for real conditions

In `src/engine/`:

- `monteCarlo.js` — raise `iterations` (e.g. 10,000+) for production; the `σ_nat` / `σ_u` uncertainty formulas can be recalibrated against historical count-night data.
- `forecast.js` — the blend weight `α` and the swing model can be extended with province-level random effects.
- `validation.js` — adjust thresholds (e.g. the large-swing tolerance) to your tolerance for false positives.

## 5. Verify reproducibility

Confirm that `computeForecast(sameIncludedResults, { seed, iterations })` returns identical numbers across runs (it must). Record `seed`, `iterations`, scenario, and the included-set hash for every published projection (`forecast_runs` in [SCHEMA.md](SCHEMA.md)).

## Checklist

- [ ] Real registered voters / turnout / 2021 priors in `geography.js`
- [ ] Real 2026 candidate slate in `candidates.js`
- [ ] Demo seed disabled; store starts from real ingestion
- [ ] Official vs verified vs unverified classification enforced at ingest
- [ ] DEMO banner removed only after all simulated data is gone
- [ ] Model iterations/seed set and logged for reproducibility
