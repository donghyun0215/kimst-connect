# 00 — System Overview

*Reverse-engineered from commit `cd1aca6`. Describes the system as it is, not as
it should be.*

## Purpose

A public event site for **KIMST Singapore Connect**, part of the K-Marine Tech
Open Innovation Week. It does three jobs:

1. **Presents** the eight participating Korean startups (one-pager per company).
2. **Takes RSVPs** for the 2 September Open Innovation Day at Suntec, including
   selection of which programme blocks the attendee will join.
3. **Books 1:1 meetings** — both the round-based slots on 2 September and the
   longer 40-minute sessions at Nuldam Space on 31 August / 4 September.

A fourth, unlisted page publishes the full delegation itinerary to programme
stakeholders.

## Actors

| Actor | Uses | Authenticated? |
|---|---|---|
| Partner / investor / distributor | `/`, `/companies/$slug`, `/book`, `/meet` | No — identified by email only |
| Programme stakeholder (MYSC, KIMST, startups) | `/schedule` | No — unlisted URL |
| Organiser (Lodestart / MYSC) | `/admin` | Shared password |

There are no user accounts. **Email is the identity primitive**: it is the RSVP
primary key, the self-service lookup key, and half of the anti-double-booking
constraint.

## Boundaries

Inside: the site, its server functions, and the Supabase tables behind them.

Outside: Supabase (managed Postgres + realtime), Vercel (hosting/CD), Google
Maps (venue deep links), Lovable (the platform that originally generated the
codebase and still syncs from the connected branch).

No email is sent by the system. Confirmations are handled manually by the
organiser — a deliberate scope limit, and the reason the `/book` page carries
self-service lookup and cancellation.

## Deployment topology

```
GitHub donghyun0215/kimst-connect (branch: main)
        │  push
        ▼
   Vercel build ──────► kimst-rsvp-2026.vercel.app
                              │  server functions (service role key)
                              ▼
                     Supabase project bmtwcumuswywghcfnwjo
                              ▲
                              │  anon key: booked_slots view + realtime only
                        browser client
```

Two credentials with sharply different power:

- **Service role key** — server-only (`src/lib/supabase-admin.server.ts`).
  Bypasses RLS. All writes and all PII reads go through it.
- **Anon key** — shipped to the browser. Can read the `booked_slots` view
  (company/timeslot pairs, no PII) and subscribe to realtime. Nothing else.

## Repository layout

| Path | Role |
|---|---|
| `src/` | The deployed application |
| `supabase/schema.sql` | Idempotent DDL, applied by hand in the Supabase SQL editor |
| `ksc/` | **Duplicate copy** of `src/`, an artefact of an earlier zip-based workflow. Mirrored on every commit to avoid divergence. Not deployed. Slated for removal once the Vercel root directory is confirmed. |
| `lodestart_v4/` | Unrelated project. Do not touch. |
| `AGENTS.md` | Lovable's constraint: never rewrite published git history |

## Stack

TanStack Start (file-based routing, server functions) · Vite · React · Tailwind
v4 · shadcn/ui · Supabase JS. TypeScript throughout. No test suite exists.
