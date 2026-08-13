# 🇿🇲 Zambia Election Terminal 2026

**A prediction & live-results analysis platform for the Zambia Presidential Election 2026** — pre-election forecasting, live results aggregation, statistical modelling, turnout analysis and real-time projections in a professional election command-centre interface (Bloomberg Terminal × FiveThirtyEight × election newsroom).

> ## ⚠️ DEMO DATA — NOT ACTUAL ELECTION RESULTS
> This build ships with **clearly labelled simulated data** — illustrative candidates and synthetic returns — so the interface can be demonstrated before real ECZ results are available. See [Replacing demo data](docs/REPLACING_DEMO_DATA.md).

---

## What it does

The platform **never invents results**. Every figure is one of five strictly-separated classes:

1. **Officially reported** (e.g. ECZ)
2. **Verified / independently reported** (reputable news)
3. **Model estimate** (engine output)
4. **Projected result** (engine output)
5. **Unverified report** (never auto-trusted)

Counted votes are always shown distinctly from model projections, and uncertainty is always communicated.

### The 13 MVP features (all live)

| # | Feature | Where |
|---|---------|-------|
| 1 | **Dashboard** command-centre with candidate cards | Dashboard |
| 2 | **Live result ingestion** (multi-source) + audit trail | Live Data & Audit |
| 3 | **Duplicate & error detection** + Data Integrity Score | Live Data → Validation |
| 4 | **Forecasting model** (reporting-bias-aware) | Forecast & Runoff |
| 5 | **Monte Carlo simulation** + credible intervals | Forecast & Runoff |
| 6 | **Runoff detection** (>50% threshold mathematics) | Forecast & Runoff |
| 7 | **"What does the remaining vote need to look like?"** | Forecast & Runoff |
| 8 | **Interactive map** (province → constituency drill-down) | Map |
| 9 | **Reporting progress** + key outstanding areas | Reporting |
| 10 | **Election Night mode** (live table + timeline) | Election Night |
| 11 | **Model explanation** ("why is it predicting this?") | Forecast & Runoff |
| 12 | **Scenario simulator** (what-if assumptions) | Scenario Sim |
| 13 | **Historical comparison** (2011–2026) | Historical |
| + | Source/audit transparency, Manual entry, Methodology | Data / Manual Entry / Methodology |

---

## How the forecast avoids naïve extrapolation

Early returns are geographically skewed (urban/UPND-leaning areas report first). The model therefore **does not** extrapolate the national reported share. Instead it:

1. Aggregates only **included** results (unverified/critically-flagged data is excluded but retained).
2. Estimates a **turnout-weighted swing vs 2021** from areas that have already reported.
3. Projects each **outstanding area from its own 2021 pattern + the swing**, blended with any partial count.
4. Runs a **seeded Monte Carlo** (correlated national swing + per-area noise) for win probabilities and 50/80/95% credible intervals.
5. Applies **runoff mathematics** (Zambia requires >50% to win in round one).

Full detail: [docs/METHODOLOGY.md](docs/METHODOLOGY.md). **Every projection is reproducible** — same included data + seed + iterations ⇒ identical numbers.

---

## Tech stack

- **React 18 + Vite** — fast, instantly demonstrable SPA
- **Tailwind CSS** — terminal theme, dark/light mode
- **Recharts** — interactive charts
- **In-browser normalized store** (localStorage) with an ingestion API abstraction, designed to be swapped for **PostgreSQL + FastAPI** with no UI changes ([docs/DATA_ARCHITECTURE.md](docs/DATA_ARCHITECTURE.md))
- Pure-JS statistical engine (forecast + Monte Carlo) — runs client-side, reproducible

> The spec's preferred production stack (Next.js / TypeScript / PostgreSQL / FastAPI / Mapbox / WebSockets) is documented as the migration target in [docs/DATA_ARCHITECTURE.md](docs/DATA_ARCHITECTURE.md). This MVP is deliberately a **single runnable app** so an analyst/newsroom can open it and use it immediately; the data and engine layers are cleanly separated from the UI so each concern can be lifted into services.

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build -> dist/
npm run preview  # serve the production build
```

No environment variables are required for the demo. See [.env.example](.env.example) for the production configuration used when wiring a real backend.

### Using it

- Open **Dashboard** for the command centre.
- Go to **Election Night** and click **Advance** (or **Auto-play**) to stream in returns and watch the projection, timeline and probabilities update live.
- **Reset** (header) restores the labelled demo snapshot.
- Add your own return in **Manual Entry** — it is validated live and audited.
- Explore **Scenario Sim** to ask "what if Mundubile wins 60% of the remaining vote?".

---

## Project structure

```
src/
  data/         normalized "database": candidates, geography, historical,
                sources, demo results, store (audit trail + persistence)
  engine/       aggregate · forecast · monteCarlo · runoff · scenario ·
                validation · explain · pipeline (compose)
  components/   ui primitives · charts · ZambiaMap · CandidateCard · RaceStatus
  screens/      Dashboard · ElectionNight · ForecastScreen · MapView ·
                Reporting · ScenarioSim · DataConsole · ManualEntry ·
                Historical · Methodology
  lib/          rng (seeded) · format · theme
docs/           METHODOLOGY · DATA_ARCHITECTURE · SCHEMA · API · REPLACING_DEMO_DATA
```

## Documentation

- [Forecasting methodology](docs/METHODOLOGY.md)
- [Data-source architecture](docs/DATA_ARCHITECTURE.md)
- [Database schema](docs/SCHEMA.md)
- [Ingestion API](docs/API.md)
- [Replacing demo data with real ECZ results](docs/REPLACING_DEMO_DATA.md)

## Critical rules the app enforces

Never invent results · never present estimates as official · never claim a win without evidence · never hide uncertainty · never treat social media as verified · never auto-trust one source · never extrapolate naïvely from early reporting · never manipulate probabilities. Every projection is reproducible.
