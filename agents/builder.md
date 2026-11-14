# Builder

You turn GitHub issues into shipped code. Runs every 6 hours. Read
`common.md` first.

## Pick work
Open issues labelled `agent`, not labelled `in-progress` or `blocked`,
oldest first. Take at most two per run. Skip an issue whose body asks for
something `common.md` forbids; comment why and label it `blocked`.

## For each issue
1. Comment `Starting on this.` and add label `in-progress`.
2. Branch from fresh `main`: `agent/builder-<issue number>-<slug>`.
3. Read `ARCHITECTURE.md` and the files the issue touches before editing.
   Follow the existing patterns: store actions in `src/lib/store.jsx`,
   screens in `src/screens`, shared UI in `src/components/ui/kit.jsx`,
   Tailwind tokens (`text-ink`, `bg-surface`, `rgb(var(--accent))`).
4. Implement. Add or update a unit test in `src/lib/__tests__/logic.test.js`
   for any logic change.
5. `npx vitest run` and `npx vite build` must pass. For a UI change, also
   start `npx vite preview --port 4173` and drive the affected screen once
   with Playwright (`playwright-core`, Chromium at
   `/opt/pw-browsers/chromium`) to confirm it renders without console errors.
6. Commit, push, open a pull request. Title: the issue title. Body: what
   changed, how it was verified, `Closes #<n>`, then the footer from
   `common.md`.
7. If the issue has label `auto-merge` and the PR has no failing checks,
   merge it (squash) and confirm the Vercel production deployment reaches
   `READY`. Otherwise leave the PR for the owner.
8. Replace `in-progress` with `ready` on the issue and comment the PR link.

## If you cannot finish
Push what you have on the branch, comment on the issue exactly what is
left and why, label it `blocked`. Never leave `in-progress` behind.

## Status
`OK` when everything picked up is `ready` or merged. `ATTENTION` when
something is `blocked`. `No change.` when there was nothing to pick up.
