# Forecasting Methodology

> Reproducible, reporting-bias-aware projection for the Zambia Presidential Election.
> Implemented in `src/engine/`. **DEMO priors** ship in `src/data/geography.js`.

## 0. Principles

- Counted votes are facts; everything else is an **estimate** and is labelled as such.
- The national *reported* share is **never** extrapolated to the whole country.
- Uncertainty is modelled explicitly and always displayed (credible intervals, probabilities).
- **Reproducible:** the same included result set + seed + iteration count always yields identical output. All randomness uses a seeded PRNG (`src/lib/rng.js`).

## 1. Aggregation — `engine/aggregate.js`

Only results that are **active** and **included in the model** are tallied (see [validation](#5-validation--integrity-scoring)). For every constituency we compute counted votes per candidate, invalid ballots, whether the return is **final**, and:

- `expectedTotal` = `final ? countedCast : max(countedCast, registered × expectedTurnout)`
- `outstanding` = `expectedTotal − countedCast`

These roll up to province and national totals, giving **% of expected vote counted** and total **outstanding**.

## 2. Swing estimation — `engine/forecast.js › estimateSwing()`

A turnout-weighted swing vs the 2021 prior, computed only from areas that have reported:

```
swing[c] = Σ_units  countedValid_u · ( currentShare_u[c] − hist2021_u[c] )  /  Σ countedValid_u
```

This captures *how the country is moving* using the places we can already see.

## 3. Outstanding-vote projection — `engine/forecast.js › buildModel()`

For every reporting unit we estimate the **mean share of its outstanding vote**:

```
prior_u   = normalize( hist2021_u + swing )          # unit's own 2021 pattern + national swing
remaining_u = α · observedShare_u + (1−α) · prior_u  # α = fraction of the unit already reported
```

- Unreported units (`α = 0`) fall back entirely to their own historical prior → **PF-leaning provinces keep PF priors**, which is what corrects for UPND-leaning areas reporting first.
- The predicted final tally of a unit is `counted_u + outstandingValid_u · remaining_u`.

The **point forecast** (`pointForecast()`) sums these deterministically for the central projection.

## 4. Monte Carlo — `engine/monteCarlo.js`

Thousands of seeded simulations. Each iteration draws:

- **One correlated national swing** `g ~ N(0, σ_nat)` applied on the HH↔BM axis across *all* outstanding units (the dominant uncertainty when little has reported), where `σ_nat = clamp(0.055·(1−reported) + 0.012, 0.012, 0.06)`.
- **Independent per-unit noise** `ε_u ~ N(0, σ_u)`, `σ_u = clamp(0.05·(1−reportingPct_u) + 0.015, …)`; **final returns contribute zero uncertainty**.

Each run produces national totals → winner (`>50%` ⇒ outright, else runoff between top two). Across runs we report per candidate: **win probability** (P share > 50% *and* first), **runoff-reach probability** (P top-2), **mean projected share**, and **50 / 80 / 95% credible intervals** (percentiles). We also report the **overall runoff probability**.

Defaults: `iterations = 4000`, `seed = 20260813` (a 4000-run pass completes in well under a second).

## 5. Validation & integrity scoring — `engine/validation.js`

Rules **flag** (never delete) anomalies and produce a **Data Integrity Score** (100 − penalties; critical −60, warning −20, info −8):

votes > registered · turnout > 100% · a single candidate > registered · negative values · missing major candidate · near-unanimous leader · large swing vs 2021 · duplicate (same unit + source) · source conflict (different leader) · identical vote pattern.

Critical flags drop a result out of the model **by default**, pending analyst review.

## 6. Runoff mathematics — `engine/runoff.js`

Let `T = countedValid + outstandingValid` (projected final valid total), `half = T/2`.

- **MATHEMATICALLY CONFIRMED** — leader's *current* votes `> half` (already >50% of the maximum possible total; cannot drop below).
- **Leader cannot be caught** — `leaderVotes > secondVotes + outstandingValid`.
- **RUNOFF MATHEMATICALLY GUARANTEED** — no candidate's `current + outstanding` can exceed `half`.
- Otherwise the status ladder uses Monte Carlo probabilities: *Too early → Too close → Leaning → Likely → Projected winner*.

**"What does the remaining vote need to look like?"** for each candidate X:

- Share of **all** outstanding valid votes to reach 50%+1: `(half+1 − votes_X) / outstandingValid`.
- Two-way share of the remaining to overtake the leader: `0.5 + (leaderVotes − votes_X) / (2 · outstandingValid)`.

## 7. Explanation — `engine/explain.js`

Every projection is accompanied by the major drivers: count progress, the reporting-bias correction (how much of the outstanding vote sits in each side's provinces), observed swing, projection + uncertainty, and the largest outstanding blocks. A probability is never shown without its reasons.

## Limitations (be honest)

- Demo priors and swing are illustrative; real accuracy depends on real 2021 constituency data and turnout.
- The swing model is reduced-form (a national HH↔BM axis plus local noise); a production model could add province-level random effects, correlated turnout, and a proper Dirichlet/multinomial vote model.
- The map is a **schematic tile cartogram**, not a geographic projection.
