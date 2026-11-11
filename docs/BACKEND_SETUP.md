# Switching Kaira from single-device to shared (Supabase)

Kaira runs in two modes, decided at build time by two public environment
variables:

| Variable | Where it comes from |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |

With neither set, the app is exactly what testers use today: one browser,
localStorage only. With both set, accounts, listings, chats, saves and
follows are shared between everyone.

The `anon` key is designed to be public. Row Level Security in
`supabase/migrations/0001_init.sql` is what protects data. The
`service_role` key must never be put in a `VITE_` variable or the repo.

## One-time setup (about 15 minutes)

1. **Create the project** at supabase.com → New project. Region: pick the
   closest to Zambia that is offered (eu-central or eu-west is fine). Save the
   database password somewhere safe; the app never needs it.

2. **Run the schema.** Supabase → SQL Editor → New query → paste the whole of
   `supabase/migrations/0001_init.sql` → Run. It creates every table, policy,
   trigger and the `listing-photos` storage bucket.

3. **Make yourself admin.** In the SQL editor:
   ```sql
   insert into public.admin_emails (email) values ('you@example.com');
   ```
   Do this before you sign up with that email. The role is stamped at sign-up.

4. **Auth settings.** Supabase → Authentication → URL Configuration:
   - Site URL: `https://kaira-jolezya-s-projects.vercel.app` (or the final domain)
   - Redirect URLs: add `https://<that-domain>/**` and, for local dev,
     `http://localhost:5173/**`.

   Authentication → Providers → Email: keep "Confirm email" on.

5. **Google sign-in (optional, recommended).** Authentication → Providers →
   Google → follow the on-screen steps to create OAuth credentials in Google
   Cloud. The callback URL Supabase shows you goes into the Google console.
   Without this, the Google button shows an error toast; email still works.

6. **Vercel environment variables.** Vercel → kaira → Settings → Environment
   Variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for
   Production and Preview. Then redeploy (Deployments → ⋯ → Redeploy).

7. **Turn off the demo listings** when you are ready to launch for real:
   `VITE_SHOW_SEED_LISTINGS=false` in Vercel. Until then the seeded demo
   listings sit alongside real ones so the app never looks empty.

## Local development

```
cp .env.example .env.local   # then fill in the two values
npm run dev
```

`.env.local` is git-ignored.

## What testers will notice

- Signing up now sends a confirmation email; the link returns to `/auth`.
- Existing testers' local accounts are not migrated: those were sandbox
  accounts on one phone. They sign up once more and the account works on
  every device.
- "Forgot password?" appears on the sign-in screen and works.
- A listing published on one phone appears on every other phone within a
  second or two; messages arrive live.
