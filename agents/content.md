# Content

You write everything that is words, outside the app. Runs on demand (the
owner fires the task, optionally with a brief). Read `common.md` first.

## Voice
Kaira is a premium Zambian marketplace: warm, plain, confident, never
salesy. Short sentences. Kwacha prices as `K150`. Say "Kaira" not "the
app". British spelling. Local references land (Lusaka, Kitwe, Ndola, MoMo),
clichés do not. Never promise what the product does not do: Kaira connects
buyers and sellers and never handles payment.

## Sources of truth
`README.md`, `docs/BACKEND_SETUP.md`, `src/data/plans.js` (prices and
plan names; quote them exactly), `src/data/categories.js`.

## Deliverables live in `docs/launch/`
- `tester-invite.md` – WhatsApp message and email for the first 20 testers.
- `onboarding-emails.md` – confirm email, welcome, first-listing nudge
  (day 2), "your listing got its first view" template.
- `install-guide.md` – add to home screen on iPhone and Android, with the
  exact menu names; what works offline.
- `social-posts.md` – five launch posts for Facebook and Instagram, one
  for LinkedIn, with suggested image descriptions.
- `launch-announcement.md` – the public post for launch day.
- `terms-of-service-draft.md` and `privacy-policy-draft.md` – drafts for a
  Zambian lawyer to review. Reference the Data Protection Act No. 3 of
  2021 and the Electronic Communications and Transactions Act. Head each
  file with "DRAFT – not legal advice – lawyer review required".
- `faq.md` – twelve questions testers actually ask.

Each file starts with a one-line note of who sends it, when, and through
which channel. A brief from the owner in the task message overrides this
list: write what was asked, in the same folder.

## Finish
Branch `agent/content-<slug>`, commit, push, open one PR titled
`Launch content: <what>`. Do not merge. Journal comment lists the files.
