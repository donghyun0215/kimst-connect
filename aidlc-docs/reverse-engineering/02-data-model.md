# 02 — Data Model

*Source: `supabase/schema.sql` plus one column added out-of-band. Project
`bmtwcumuswywghcfnwjo`.*

## Tables

### `bookings` — one row per confirmed 1:1 meeting

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `company_id` | text | Company slug. **Not** an FK — companies live in TS |
| `timeslot_id` | text | `slot1..3` (2 Sep) or Nuldam slot ids. Also not an FK |
| `full_name`, `organisation`, `job_title`, `email`, `phone` | text NOT NULL | Attendee PII |
| `primary_interest`, `notes` | text NULL | Optional |
| `created_at` | timestamptz | |

Two unique constraints carry the entire booking logic:

| Constraint | Meaning |
|---|---|
| `bookings_company_timeslot_key (company_id, timeslot_id)` | One meeting per company per round — a slot is a seat |
| `bookings_email_timeslot_key (email, timeslot_id)` | One person cannot hold two companies in the same round; may hold one per round |

These are enforced in Postgres, not in application code. `createBooking`
inspects error code `23505` and the constraint name in the message to decide
which user-facing error to return. **Renaming a constraint silently breaks that
mapping** — the insert would still fail correctly, but the message degrades to
the generic "no longer available".

RLS is enabled and **no policies are defined**, deliberately: the table holds
PII, and only the service role (which bypasses RLS) touches it.

### `rsvps` — one row per attendee

Email-unique; re-submitting the same email updates the row (`onConflict: "email"`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `full_name`, `organisation`, `job_title`, `phone` | text NOT NULL | |
| `email` | text UNIQUE NOT NULL | Identity key for the whole system |
| `primary_interest`, `notes` | text NULL | |
| `additional_attendees` | text NULL | ⚠️ **Not in `schema.sql`** — see drift below |
| `attend_showcase`, `attend_lunch`, `attend_meetups` | boolean NOT NULL default false | Which blocks they join |
| `created_at`, `updated_at` | timestamptz | `updated_at` set by the upsert |

### `booking_events` — append-only audit trail

Snapshots each booking/cancel so the record survives deletion of the `bookings`
row.

| Column | Notes |
|---|---|
| `event_type` | CHECK in (`booked`, `cancelled_by_user`, `cancelled_by_admin`) |
| `booking_id`, `company_id`, `timeslot_id`, `full_name`, `organisation`, `email` | Snapshot at event time |
| `created_at` | |

Service role has `select, insert` only — no update or delete. Immutability is
enforced by grant, not by trigger.

### `booked_slots` — public view

```sql
create or replace view public.booked_slots as
  select company_id, timeslot_id from public.bookings;
```

The only object readable with the anon key. Exposes occupancy without PII, which
is what lets the browser grey out taken slots directly.

## Realtime

`bookings`, `booking_events`, and `rsvps` are all added to the
`supabase_realtime` publication (idempotently, via `DO` blocks that swallow
`duplicate_object`).

## ⚠️ Schema drift

`additional_attendees` exists in production but **not** in `supabase/schema.sql`.
It was added by running `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` directly in
the Supabase SQL editor. Consequences:

- `schema.sql` can no longer rebuild the production schema.
- Nothing in the repository records that the column exists; only the TypeScript
  interface `AdminRsvp` and the upsert payload imply it.

This is the same gap that caused the production incident described in
`04-constraints-risks.md`. Reconciling it is a candidate first work item.

## Invariants (as enforced today)

1. A `(company, timeslot)` pair holds at most one booking. *(DB)*
2. An email holds at most one booking per timeslot. *(DB)*
3. An email has at most one RSVP. *(DB)*
4. Round 3 is bookable only for companies listed in `ROUND3_COMPANY_SLUGS`. *(App — `isSlotOffered`, client-side only)*
5. Nuldam slots are bookable only for companies in `NULDAM_COMPANY_SLUGS`. *(App — client-side only)*
6. An RSVP must select at least one programme block. *(App — `createRsvp`)*
7. At most 3 meetup selections are processed per RSVP. *(App — `slice(0, 3)`)*

Invariants 4 and 5 are **presentation-layer only**. `createBooking` does not
re-check them, so a crafted request could book a company into a round it was
never offered. Low impact today (the result is an unexpected but harmless row),
but worth noting as a validation gap.
