-- KIMST Singapore Connect — 1:1 Meeting Booking Schema
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run.

-- ── bookings table ──────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  timeslot_id text not null,
  full_name text not null,
  organisation text not null,
  job_title text not null,
  email text not null,
  phone text not null,
  primary_interest text,
  notes text,
  created_at timestamptz not null default now(),

  -- A company can only be booked once per timeslot (one meeting = one seat).
  constraint bookings_company_timeslot_key unique (company_id, timeslot_id),
  -- One email can only hold one booking per timeslot (prevents applying to
  -- two companies in the same session; still allows session 1 + session 2).
  constraint bookings_email_timeslot_key unique (email, timeslot_id)
);

alter table public.bookings enable row level security;

-- No public policies are created on `bookings` on purpose — the table
-- contains applicant PII (name, email, phone) and all writes/reads happen
-- server-side via the service role key in the TanStack Start server
-- functions (src/lib/booking.server.ts), which bypasses RLS.

-- ── public availability view ────────────────────────────────────
-- Exposes only which (company, timeslot) pairs are taken — no PII — so the
-- browser can grey out full slots using the anon key.
create or replace view public.booked_slots as
  select company_id, timeslot_id from public.bookings;

grant select on public.booked_slots to anon, authenticated;

-- ── realtime ────────────────────────────────────────────────────
-- Broadcast INSERT/DELETE on bookings so the admin dashboard live-updates.
-- (The admin page also polls every 20s as a fallback, so this is optional
-- but recommended.)
alter publication supabase_realtime add table public.bookings;

-- ── verification query (optional) ───────────────────────────────
-- select * from public.bookings order by created_at desc;
