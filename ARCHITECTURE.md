# Kaira — Architecture

This document explains how Kaira is put together and where you'd extend it toward a full production
backend. It complements the high-level overview in the [README](README.md).

## Principles

1. **The UI never touches storage directly.** All state flows through a single reducer
   (`src/lib/store.jsx`). Screens dispatch actions; derived data comes from selector hooks
   (`useAllListings`, `useCurrentUser`). This is the seam where a network layer plugs in.
2. **Pure logic is isolated and tested.** Search, formatting, and the AI heuristics are side-effect
   free modules in `src/lib`, unit-tested with Vitest. They contain no React and no I/O.
3. **Design is tokenised.** Colors, elevation and motion are CSS variables (`src/index.css`) mapped
   into Tailwind (`tailwind.config.js`). Light/dark is a single `data-theme` attribute swap.
4. **Offline-first.** The app, its logic and its (generative) imagery work with no network. Remote
   assets, when present, are runtime-cached by the service worker.

## Layers

```
┌─────────────────────────────────────────────┐
│ screens/         route components (views)    │
├─────────────────────────────────────────────┤
│ components/      reusable UI + primitives     │
├─────────────────────────────────────────────┤
│ lib/store.jsx    global state (the backend)   │  ← swap side-effects for a real API here
│ lib/ai.js        heuristics (ML/LLM seam)     │
│ lib/search.js    filter + sort engine         │
│ lib/*            format / images / hooks      │
├─────────────────────────────────────────────┤
│ data/            seed content (DB fixtures)   │  ← becomes your database schema
└─────────────────────────────────────────────┘
```

## Data model (would map 1:1 to DB tables)

- **User** — id, name, handle, location(+lat/lng), rating, reviews, responseTime, verified[],
  plan, business, followers, bio.
- **Listing** — id, title, category, subcategory, price(+suffix/label), negotiable, condition,
  brand, color, location, sellerId, postedAt, description, specs{}, tags[], photoCount/photos[],
  premium, sponsored, views, saves.
- **Conversation** — id, sellerId, listingId, unread, typing, messages[] (from, text, type, at).
- **Notification** — id, type, title, body, read, at, meta{}.
- **Plan** — id, name, price, limits, features[].

## Store actions (the "API surface")

Auth (`SIGN_IN`, `SIGN_OUT`), theme, `SET_PLAN`, `TOGGLE_SAVE`, `VIEW`, `SAVE_SEARCH`/`REMOVE_SEARCH`,
`FOLLOW`, `SAVE_DRAFT`/`DELETE_DRAFT`, `PUBLISH`/`DELETE_LISTING`, `START_CONVERSATION`,
`SEND_MESSAGE`/`RECEIVE_MESSAGE`/`SET_TYPING`/`READ_CONVERSATION`, and notification actions. Each is a
clean insertion point for an HTTP/WebSocket call.

### Turning this into a real backend

- Replace the reducer's in-memory writes with API calls (optimistic update → reconcile).
- Move `data/*` into a database; keep the same shapes.
- Messaging: back `SEND_MESSAGE`/`RECEIVE_MESSAGE` with WebSockets/SSE instead of the local
  auto-responder in `Chat.jsx`.
- AI: `lib/ai.js` functions keep their signatures; call a model service behind them.
- Auth: swap the simulated `SIGN_IN` for OAuth (Apple/Google) + email magic links.

## Performance

- **Route-level `React.lazy`** splits every screen; Recharts only loads on `/admin`.
- Listing imagery is generated as compact SVG data URIs (no network round-trips).
- Search is O(n) over an in-memory list with memoised results and a skeleton transition.
- The service worker precaches the shell and runtime-caches images.

## Accessibility

Focus-visible rings, `aria-label`s on icon buttons, `role="switch"`/`aria-checked`, semantic
headings, reduced-motion media query, and WCAG-minded contrast in both themes.
