# Kaira's launch agents

Five agents run the launch with as little human time as possible. Each one
is a Claude Code session started by a scheduled task in the owner's cloud
environment; its instructions are the matching file in this folder. Edit the
file, and the next run follows the new instructions. No redeploy needed.

| Agent | File | Runs | Job |
| --- | --- | --- | --- |
| Boss | `boss.md` | daily 19:40 CAT, long form Fridays | Reports to the owner: achieved, in progress, blocked on you, next. Keeps `docs/LAUNCH_CHECKLIST.md` current. |
| Watchdog | `watchdog.md` | every 4 hours | Production health: Vercel build, live URL, runtime errors, backend reachability. Hotfixes a broken build. |
| Operations | `operations.md` | daily 06:40 CAT | Marketplace ops: reports queue, suspicious listings, tester feedback, daily numbers. Drafts, never sends. |
| Builder | `builder.md` | every 6 hours | Implements GitHub issues labelled `agent`. Tests, pushes, opens a PR; merges only when labelled `auto-merge`. |
| Content | `content.md` | on demand | Writes launch copy: invites, onboarding emails, install guide, posts, legal drafts. |

Every agent follows `common.md` first.

## How the owner steers

- **Give work**: open a GitHub issue, label it `agent`. Add `auto-merge` if it
  may ship without review. Label tester feedback `feedback`.
- **Read progress**: the issue titled **Agent log** is the shared journal; the
  issue titled **Launch status** is the boss's living summary. The boss also
  sends a push notification after each run.
- **Change behaviour**: edit the agent's file here and commit to `main`.
- **Pause an agent**: disable its scheduled task in Claude Code settings.

## Approval rules (edit to taste)

Agents MAY without asking: fix bugs, add tests, improve copy inside the app,
hotfix a broken production build, triage issues, draft replies.

Agents MUST NOT without an issue from the owner saying so: change prices or
plans (`src/data/plans.js`), delete or edit user data, publish anything
outside GitHub (no emails sent, no posts published), spend money, create
accounts, or touch `.env*` files and secrets.
