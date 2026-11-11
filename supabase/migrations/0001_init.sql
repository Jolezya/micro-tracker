-- ============================================================
-- Kaira — Phase 1 schema
-- Run once against a fresh Supabase project (SQL editor, or `supabase db push`).
--
-- Principles
--   • Client-generated text ids for listings/conversations/messages (l_…, c_…,
--     m_…) so optimistic local state and the remote row share an identity.
--   • Users are auth.users; `profiles` mirrors the public part.
--   • Row Level Security on everything. The anon key is public; RLS is the
--     only thing standing between a browser and other people's data.
--   • JSON where the shape is owned by the app (location, attrs) so category
--     schemas can evolve without a migration.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- admin allowlist (add a row, no redeploy) ----------
create table if not exists public.admin_emails (
  email text primary key
);
insert into public.admin_emails (email) values ('admin@kaira.zm') on conflict do nothing;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null default '',
  handle         text unique,
  email          text,
  phone          text,
  phone_verified boolean not null default false,
  location       text not null default '',
  bio            text not null default '',
  avatar_url     text,
  provider       text not null default 'email',
  role           text not null default 'member' check (role in ('member','admin')),
  plan           text not null default 'free',
  verified       text[] not null default '{}',
  rating         numeric,
  reviews        integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Create the profile the moment an account exists. Role comes from the
-- allowlist here, server-side — never from anything the client sends.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name   text := coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '');
  v_handle text;
begin
  v_handle := left(regexp_replace(lower(coalesce(nullif(v_name,''), split_part(new.email,'@',1))), '[^a-z0-9]+', '', 'g'), 18);
  if v_handle = '' then v_handle := 'kaira'; end if;
  -- handles must be unique; suffix on collision
  if exists (select 1 from public.profiles where handle = v_handle) then
    v_handle := left(v_handle, 12) || substr(replace(new.id::text,'-',''), 1, 6);
  end if;
  insert into public.profiles (id, name, handle, email, provider, role, verified)
  values (
    new.id, v_name, v_handle, new.email,
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then 'admin' else 'member' end,
    case when new.email_confirmed_at is not null then array['email'] else '{}'::text[] end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Mark email verified when Supabase confirms it.
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and (old.email_confirmed_at is null) then
    update public.profiles set verified = array(select distinct unnest(verified || array['email']))
    where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users for each row execute function public.handle_user_confirmed();

-- ---------- listings ----------
create table if not exists public.listings (
  id            text primary key,
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  category      text not null,
  subcategory   text,
  brand         text,
  condition     text,
  price         numeric not null default 0,
  negotiable    boolean not null default true,
  price_label   text,
  price_suffix  text,
  description   text not null default '',
  location      jsonb,
  photos        text[] not null default '{}',
  photo_count   integer not null default 0,
  listing_plan  text not null default 'mahala',
  contact_phone text,
  delivery      text[] not null default '{}',
  tags          text[] not null default '{}',
  attrs         jsonb not null default '{}'::jsonb,
  premium       boolean not null default false,
  sponsored     boolean not null default false,
  views         integer not null default 0,
  saves         integer not null default 0,
  status        text not null default 'active' check (status in ('active','sold','expired','removed')),
  boosted_until timestamptz,
  boost_id      text,
  posted_at     timestamptz not null default now(),
  edited_at     timestamptz,
  expires_at    timestamptz
);
create index if not exists listings_active_idx   on public.listings (status, posted_at desc);
create index if not exists listings_seller_idx   on public.listings (seller_id);
create index if not exists listings_category_idx on public.listings (category, status);

-- Expiry follows the plan: Mahala 30d, Premium 45d, Gold 60d, Corporate 90d.
-- Enforcement (hiding expired rows, renewal) is Phase 2; the date is set now
-- so nothing published before then is missing one.
create or replace function public.set_listing_expiry()
returns trigger language plpgsql as $$
begin
  if new.expires_at is null or (tg_op = 'UPDATE' and new.listing_plan is distinct from old.listing_plan) then
    new.expires_at := coalesce(new.posted_at, now()) + (
      case new.listing_plan when 'gold' then 60 when 'premium' then 45 when 'corporate' then 90 else 30 end
    ) * interval '1 day';
  end if;
  return new;
end $$;
drop trigger if exists listings_expiry on public.listings;
create trigger listings_expiry before insert or update on public.listings
  for each row execute function public.set_listing_expiry();

-- Views: anyone (including guests) may bump a counter, but never read or
-- write anything else through it. Security definer so RLS on listings
-- doesn't block the update for non-owners.
create or replace function public.increment_views(p_listing_id text)
returns void language sql security definer set search_path = public as $$
  update public.listings set views = views + 1 where id = p_listing_id and status = 'active';
$$;
grant execute on function public.increment_views(text) to anon, authenticated;

-- ---------- saves (favourites) ----------
create table if not exists public.saves (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id text not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index if not exists saves_listing_idx on public.saves (listing_id);

-- The seller's `saves` counter moves with the table, server-side.
create or replace function public.sync_saves_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.listings set saves = saves + 1 where id = new.listing_id;
    -- tell the seller someone saved their item
    insert into public.notifications (id, user_id, type, title, body, meta)
    select 'n_' || substr(replace(gen_random_uuid()::text,'-',''),1,12), l.seller_id, 'favorite',
           'Someone saved your item', l.title || ' was added to a buyer''s favourites', jsonb_build_object('listingId', l.id)
    from public.listings l where l.id = new.listing_id and l.seller_id <> new.user_id;
    return new;
  else
    update public.listings set saves = greatest(0, saves - 1) where id = old.listing_id;
    return old;
  end if;
end $$;
drop trigger if exists saves_count on public.saves;
create trigger saves_count after insert or delete on public.saves
  for each row execute function public.sync_saves_count();

-- ---------- follows ----------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, seller_id),
  check (follower_id <> seller_id)
);

-- ---------- conversations & messages ----------
create table if not exists public.conversations (
  id         text primary key,
  listing_id text references public.listings(id) on delete set null,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  seller_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index if not exists conversations_buyer_idx  on public.conversations (buyer_id, updated_at desc);
create index if not exists conversations_seller_idx on public.conversations (seller_id, updated_at desc);

create table if not exists public.messages (
  id              text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  kind            text not null default 'text' check (kind in ('text','offer','location','photo')),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

-- Keep the thread ordered by activity and notify the other participant.
create or replace function public.after_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conv public.conversations;
  v_to   uuid;
  v_from text;
begin
  select * into v_conv from public.conversations where id = new.conversation_id;
  update public.conversations set updated_at = now() where id = new.conversation_id;
  v_to := case when new.sender_id = v_conv.buyer_id then v_conv.seller_id else v_conv.buyer_id end;
  select coalesce(nullif(name,''), 'A buyer') into v_from from public.profiles where id = new.sender_id;
  insert into public.notifications (id, user_id, type, title, body, meta)
  values ('n_' || substr(replace(gen_random_uuid()::text,'-',''),1,12), v_to, 'message',
          'New message from ' || split_part(v_from, ' ', 1), left(new.body, 90),
          jsonb_build_object('convId', new.conversation_id));
  return new;
end $$;
drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.after_message_insert();

-- ---------- reports ----------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  text references public.listings(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  status      text not null default 'open' check (status in ('open','dismissed','removed')),
  created_at  timestamptz not null default now()
);

-- ---------- notifications ----------
create table if not exists public.notifications (
  id         text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null default '',
  meta       jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.admin_emails  enable row level security;
alter table public.profiles      enable row level security;
alter table public.listings      enable row level security;
alter table public.saves         enable row level security;
alter table public.follows       enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.reports       enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- admin_emails: nobody reads it from the client; the trigger runs as definer.

-- profiles: public read (sellers are public), self-write. Role and plan are
-- not client-editable — the policy's WITH CHECK pins them to current values.
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_update on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid()
    and role = (select role from public.profiles p where p.id = auth.uid())
    and plan = (select plan from public.profiles p where p.id = auth.uid()));

-- listings: everyone sees active ones; sellers see all of their own;
-- sellers insert/update/delete their own; admins can do anything.
drop policy if exists listings_read   on public.listings;
drop policy if exists listings_insert on public.listings;
drop policy if exists listings_update on public.listings;
drop policy if exists listings_delete on public.listings;
create policy listings_read   on public.listings for select
  using (status = 'active' or seller_id = auth.uid() or public.is_admin());
create policy listings_insert on public.listings for insert
  with check (seller_id = auth.uid());
create policy listings_update on public.listings for update
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());
create policy listings_delete on public.listings for delete
  using (seller_id = auth.uid() or public.is_admin());

-- saves / follows: strictly your own rows.
drop policy if exists saves_all on public.saves;
create policy saves_all on public.saves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists follows_all on public.follows;
create policy follows_all on public.follows for all
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- conversations: participants only. A buyer opens one; either side reads.
drop policy if exists conversations_read   on public.conversations;
drop policy if exists conversations_insert on public.conversations;
create policy conversations_read on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy conversations_insert on public.conversations for insert
  with check (buyer_id = auth.uid());

-- messages: participants read; you may only send as yourself, into a thread
-- you belong to; you may mark the OTHER side's messages read.
create or replace function public.is_participant(p_conv text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations c
                 where c.id = p_conv and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()));
$$;
drop policy if exists messages_read   on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;
create policy messages_read   on public.messages for select using (public.is_participant(conversation_id));
create policy messages_insert on public.messages for insert
  with check (sender_id = auth.uid() and public.is_participant(conversation_id));
create policy messages_update on public.messages for update
  using (public.is_participant(conversation_id) and sender_id <> auth.uid())
  with check (public.is_participant(conversation_id) and sender_id <> auth.uid());

-- reports: anyone signed in can file one; only admins read them.
drop policy if exists reports_insert on public.reports;
drop policy if exists reports_read   on public.reports;
drop policy if exists reports_update on public.reports;
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_read   on public.reports for select using (public.is_admin());
create policy reports_update on public.reports for update using (public.is_admin());

-- notifications: your own; you can mark yours read.
drop policy if exists notifications_read   on public.notifications;
drop policy if exists notifications_update on public.notifications;
create policy notifications_read   on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Realtime: messages (chat), conversations (new threads), listings (feed)
-- ============================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.listings;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- ============================================================
-- Storage: listing photos. Public read; each user writes only under their
-- own folder:  listing-photos/{user_id}/{listing_id}/{n}.jpg
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "photos public read"   on storage.objects;
drop policy if exists "photos owner insert"  on storage.objects;
drop policy if exists "photos owner update"  on storage.objects;
drop policy if exists "photos owner delete"  on storage.objects;
create policy "photos public read" on storage.objects for select
  using (bucket_id = 'listing-photos');
create policy "photos owner insert" on storage.objects for insert
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos owner update" on storage.objects for update
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos owner delete" on storage.objects for delete
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
