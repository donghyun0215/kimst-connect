-- KIMST Singapore Connect — 1:1 Meeting Booking Schema
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent (if not exists / or replace).

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

-- ── audit log ────────────────────────────────────────────────────
-- Records every booking creation/cancellation as an immutable event, with a
-- snapshot of the booking details, so the trail survives the row being
-- deleted from `bookings`. Answers "who booked what, when, and who
-- cancelled it" in the admin dashboard.
create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('booked', 'cancelled_by_user', 'cancelled_by_admin')),
  booking_id uuid not null,
  company_id text not null,
  timeslot_id text not null,
  full_name text not null,
  organisation text,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.booking_events enable row level security;

-- ── rsvps table ─────────────────────────────────────────────────
-- One row per attendee (email-unique). Captures which program blocks they
-- will attend: Success Story Showcase, Networking Lunch (catering headcount),
-- and 1:1 Onsite Meetups. Re-submitting with the same email updates choices.
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  organisation text not null,
  job_title text not null,
  email text not null unique,
  phone text not null,
  primary_interest text,
  notes text,
  attend_showcase boolean not null default false,
  attend_lunch boolean not null default false,
  attend_meetups boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.rsvps enable row level security;

-- ── service_role grants ─────────────────────────────────────────
-- With "Automatically expose new tables" disabled on the project, even
-- service_role needs explicit table privileges. All reads/writes go through
-- the server functions using this role.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.bookings to service_role;
grant select, insert on public.booking_events to service_role;
grant select, insert, update, delete on public.rsvps to service_role;
alter default privileges in schema public grant all on tables to service_role;

-- ── public availability view ────────────────────────────────────
-- Exposes only which (company, timeslot) pairs are taken — no PII — so the
-- browser can grey out full slots using the anon key.
create or replace view public.booked_slots as
  select company_id, timeslot_id from public.bookings;

grant select on public.booked_slots to anon, authenticated;

-- ── realtime ────────────────────────────────────────────────────
-- Broadcast INSERT/DELETE so the booking page and admin dashboard live-update.
-- (Both pages also poll on an interval as a fallback, so this is optional
-- but recommended.) Safe to re-run — errors harmlessly if already added.
do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.booking_events;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.rsvps;
exception when duplicate_object then null;
end $$;

-- ── verification queries (optional) ─────────────────────────────
-- select * from public.bookings order by created_at desc;
-- select * from public.booking_events order by created_at desc;
