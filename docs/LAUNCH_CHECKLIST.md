# Kaira launch checklist

Owner: **Owner** items need a human (identity, money, legal). **Agent**
items the agents do. The boss agent keeps this file current.

## 1. Backend live (Phase 1) — blocks everything below
- [ ] **Owner** Create the Supabase project (supabase.com, free tier, EU region)
- [ ] **Owner** Run `supabase/migrations/0001_init.sql` in the SQL editor
- [ ] **Owner** Add your admin email to `admin_emails` before signing up
- [ ] **Owner** Send the Project URL and `anon public` key to the builder session
- [ ] **Agent** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on Vercel, redeploy
- [ ] **Agent** Two-browser live verification: listing appears cross-device, chat arrives live
- [ ] **Owner** Save the `service_role` key as a network secret for the ops agent (never in the repo)
- [ ] **Owner** Supabase Auth → URL configuration: site URL + redirect URLs
- [ ] **Owner** Google Cloud OAuth client → paste into Supabase Google provider
- [x] **Agent** Schema, RLS, storage, auth flows, photo upload, store sync (shipped 2026-11-11)

## 2. Money
- [ ] **Owner** Decide: MTN MoMo and Airtel Money merchant accounts (needs registered business) or a PSP such as Lenco or Flutterwave
- [ ] **Owner** Open the merchant/PSP account and obtain API keys
- [ ] **Agent** Phase 2: payment flow for Premium/Gold listings and boosts, receipts, VAT line
- [ ] **Agent** Enforce the Free plan's 10-listing cap

## 3. Legal and company
- [ ] **Owner** Business registration (PACRA) and TPIN/VAT (ZRA)
- [ ] **Agent** Draft Terms of Service and Privacy Policy (content agent)
- [ ] **Owner** Lawyer review of both drafts
- [ ] **Agent** Terms and privacy screens in the app, consent at sign-up

## 4. Domain and identity
- [ ] **Owner** Buy the domain (for example kaira.co.zm via ZICTA registrar, or kaira.app)
- [ ] **Agent** Point the domain at Vercel, update Supabase redirect URLs and PWA manifest
- [ ] **Owner** Transactional email domain (Resend or Postmark, free tier) so confirmation mail is not from supabase.io

## 5. Product hardening
- [ ] **Agent** Turn off demo listings at launch (`VITE_SHOW_SEED_LISTINGS=false`)
- [ ] **Agent** Launch promotion coded (first listing free on Premium, if wanted)
- [ ] **Agent** Error monitoring wired to the watchdog (Vercel runtime errors already read)
- [ ] **Agent** Playwright smoke suite runs in CI on every push

## 6. Go to market
- [ ] **Agent** Tester invite, onboarding emails, install guide, posts, FAQ (content agent)
- [ ] **Owner** Approve the copy
- [ ] **Owner** Pick 20 testers across Lusaka, Kitwe and Ndola; send the invite
- [ ] **Agent** Triage feedback daily (operations agent)
- [ ] **Owner** Launch day go/no-go

## 7. Agents
- [x] **Agent** Boss, watchdog, operations, builder, content created (2026-11-14)
- [ ] **Owner** Confirm the approval rules in `agents/README.md` or edit them
