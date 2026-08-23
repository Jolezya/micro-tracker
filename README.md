# Kaira — Premium Marketplace

> A premium **Zambian** marketplace, inspired by the functionality of Finn.no but redesigned from
> scratch for a world-class, App-Store-ready experience. Buy and sell almost anything — **Kaira
> connects buyers and sellers and never processes payments**. People settle their own way
> (MTN / Airtel Mobile Money, bank transfer, cash, in person… whatever they agree on).
>
> Localised for Zambia: prices in **Kwacha (ZMW)**, and a location picker covering **every district
> across all 10 provinces**.

Built as an installable, offline-capable **PWA** — it runs on iOS, Android and the responsive web
from a single codebase. Add it to your home screen and it behaves like a native app.

![Kaira](public/icon.svg)

---

## ✨ Highlights

- **Category-aware search & filters** — a reusable, schema-driven filter framework (`data/filterSchema.js`):
  each category defines its own filters (Vehicles get make→model, fuel, transmission, year, mileage…;
  Property gets bedrooms, furnished, pool…; Land drops "condition" for plot size / title deed / services;
  Jobs get job type, work mode, salary, experience). Quick filters, removable active-filter chips,
  searchable dropdowns, ranges, live result counts, dependent options, and filters that persist per
  category. Adding a new category = adding a schema, no UI changes.
- **Premium design system** — Scandinavian minimalism, glassmorphism, soft shadows, luxury spacing,
  fluid Framer Motion transitions, micro-interactions, skeleton loading, pull-to-refresh, swipeable
  galleries with **pinch-to-zoom**, and full **light / dark mode**.
- **Every screen implemented & working** — Home, Search, Listing detail, Seller profiles, real-time
  style Messaging, a guided 4-step Sell flow (plan → photos → details → review), Notifications,
  Subscription plans, an Admin dashboard, and Auth.
- **Smart features (on-device AI heuristics)** — auto category detection, title & description
  generation, price suggestions from comparable listings, duplicate detection, fraud / trust scoring,
  and smart recommendations. All transparent, deterministic and unit-tested.
- **Rich, realistic content** — 30+ listings across every category (Tesla Model Y, BMW M3, Audi RS6,
  luxury villa, cabin, iPhone, MacBook Pro, PS5, designer furniture, Rolex, Louis Vuitton, road bike,
  kayak, Pokémon cards, pets, a boat, a job, a service…), each with a seller, price, location and specs.
- **Fast** — route-level code splitting, lazy loading, cached listing imagery, instant client-side
  search, infinite content and a ~110 KB gzipped initial bundle.
- **Accessible** — semantic markup, focus-visible rings, `aria-label`s, reduced-motion support,
  theme-aware color tokens and large tap targets.

---

## 🧱 Tech stack

| Area | Choice |
|------|--------|
| Framework | **React 18** + **Vite 5** |
| Routing | **react-router-dom 6** (lazy routes) |
| Styling | **Tailwind CSS** with a CSS-variable semantic token system (light/dark) |
| Animation | **Framer Motion** |
| Icons | **lucide-react** |
| Charts | **Recharts** (admin analytics) |
| State | React Context + `useReducer`, persisted to `localStorage` |
| PWA | **vite-plugin-pwa** (Workbox) — installable + offline |
| Tests | **Vitest** |

### Why a client-first architecture?

The app ships with a fully-typed **data layer** (`src/data`) and a **store** (`src/lib/store.jsx`)
that acts as a local backend: listings, users, conversations, notifications, saved items, drafts and
subscriptions all live in a single reducer and persist across sessions. Every read/write goes through
action creators, so swapping in a real REST/GraphQL backend is a matter of replacing the reducer's
side-effects — the UI never talks to storage directly. See [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 🚀 Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # production build → dist/
npm run preview      # preview the production build
npm run test         # run the Vitest suite
```

### Deploy

Any static host works (the app is a pure SPA + service worker):

- **Vercel / Netlify** — import the repo, framework preset “Vite”, build `npm run build`, output `dist`.
- **GitHub Pages / S3 / Cloudflare Pages** — upload `dist/`. Ensure SPA fallback rewrites all routes
  to `/index.html`.

Then open the URL on a phone → **Share → Add to Home Screen** to install Kaira as an app.

---

## 📁 Project structure

```
src/
  data/            # sample content (categories, users, listings, plans)
  lib/
    store.jsx      # global state + localStorage persistence (the "backend")
    ai.js          # category detection, pricing, gen text, fraud/dup, recommend
    search.js      # pure filter + sort engine
    format.js      # currency, time-ago, distance, numbers
    media.js       # image resolution: seller → real → branded placeholder
    glyphs.js      # product glyph SVGs (extracted from lucide)
    usePullToRefresh.jsx
  components/
    ui/            # Button, Badge, Chip, Avatar, Sheet, Modal, Toast, Switch…
    layout/        # AppShell (sidebar + bottom nav), headers, logo
    ListingCard, Gallery, MapView, SmartImage, CategoryIcon
  screens/         # Home, Search, ListingDetail, SellerProfile, Messages, Chat,
                   # Sell, Profile, Saved, Notifications, Plans, Admin, Auth
  App.jsx          # routes (lazy-loaded)
  main.jsx         # providers (Store, Toast) + Router
```

---

## 🖼️ Imagery

Every listing resolves its cover through one media layer (`src/lib/media.js`) with a strict priority
order — **seller photos always win**:

1. `listing.photos[]` — seller-uploaded images
2. `listing.imageUrls[]` — real category photography (the production seam)
3. `CATEGORY_STOCK[kind]` — a bundled/remote stock library, if configured
4. A **branded, category-specific placeholder** — a tasteful, brand-tinted "studio" tile showing the
   product's icon (car, house, phone, sneaker, dog, plot…), never a random gradient.

The placeholder is self-contained, so the app looks polished offline and in previews, while real
photography slots in for a live deployment **without any UI changes**.

**To add real photos:** give listings an `imageUrls: ["https://…"]` array (or seller `photos`), or
drop files in `public/` and populate `CATEGORY_STOCK` in `media.js`. `<SmartImage>` progressively
loads each photo (blur-up + skeleton) and falls back to the branded placeholder on error; the service
worker runtime-caches remote images for offline viewing.

> Note: the build sandbox blocks all image CDNs, so this repo ships with branded placeholders and the
> real-photo seam ready — a normal web deployment (where the browser can reach an image host) or a
> bundled `public/` image pack turns on photography everywhere.

---

## 🔌 Selling plans & monetisation

One principle: **everyone can sell — paying buys visibility, not access.** Basic selling functionality
is never gated. Defined in `data/plans.js`:

- **Mahala (free)** — a complete basic listing: photos, title, price, location, normal search,
  buyer chat, edit/save, 30-day duration.
- **Premium** *(recommended)* — sell faster: higher search position, Premium badge, featured
  placement, more recommendations, longer duration, analytics, boost ability.
- **Gold** — maximum exposure: top placement, Gold badge, homepage exposure, featured-category,
  priority recommendations, longest duration, advanced analytics, priority support.
- **Boost** 🚀 — a *separate* add-on (24h / 3d / 7d) available on any plan, reach scaling with the
  plan. Applies to existing listings without changing the plan.
- **Corporate** 🏢 — a *separate* business platform (bulk upload, company profile & branding, staff
  accounts, lead management, dashboard, dedicated support).

**Benefits are category-aware:** `planBenefits(plan, category)` adapts wording automatically —
"Featured vehicle" / "Featured property" / "Highlighted job", "Dealer promotion" vs "Employer
branding" (hidden entirely where irrelevant). Sellers choose a plan in the guided Sell flow (with
"Compare plans"), and can **upgrade or boost a live listing** afterwards from the listing page or
their profile — no need to recreate it. Kaira never processes the buyer↔seller payment.

---

## 🧪 Tests

`npm run test` runs the Vitest suite in `src/lib/__tests__`, covering the pure logic: search
filter/sort, formatting, distance math, and every AI heuristic (category detection, pricing,
generation, duplicate & fraud detection, recommendations) plus the deterministic image generator.

---

## 📄 License

Sample/demo project. Brand name “Kaira” and all content are fictional.
