# 01 — Static Model

*Structure of the codebase at commit `cd1aca6`.*

## Route tree

File-based routing under `src/routes/`. Six routes, all public.

| Route | File | LOC | Purpose |
|---|---|---:|---|
| `/` | `index.tsx` | 507 | Landing: hero, three audience cards, company grid by track, About |
| `/companies/$slug` | `companies/$slug.tsx` | 289 | Per-company one-pager; CTA branches by track membership |
| `/book` | `book.tsx` | 710 | RSVP form + 2 Sep 1:1 round picker + self-service lookup/cancel |
| `/meet` | `meet.tsx` | 525 | Nuldam 40-minute booking, accordion by company |
| `/admin` | `admin.tsx` | 559 | Password-gated dashboard: bookings grid, RSVP table, audit log |
| `/schedule` | `schedule.tsx` | 490 | **Unlisted** itinerary. `noindex, nofollow`; linked from nowhere |

`__root.tsx` holds the document shell and error boundary. `routeTree.gen.ts` is
generated — never edit by hand.

## Server functions

All in `src/lib/booking.server.ts` (434 LOC), the single trust boundary. Each is
a TanStack `createServerFn` running with the service role key.

| Function | Method | Auth | Effect |
|---|---|---|---|
| `createBooking` | POST | none | Insert one booking; maps unique violations to typed errors |
| `fetchBookedSlots` | GET | none | All `(company_id, timeslot_id)` pairs — availability greying |
| `lookupBookingsByEmail` | POST | email as bearer | Returns that email's bookings |
| `selfCancelBooking` | POST | email must match row | Deletes booking, logs `cancelled_by_user` |
| `createRsvp` | POST | none | Upsert RSVP by email, then book selected meetup slots |
| `lookupRsvpByEmail` | POST | email as bearer | Returns that email's RSVP |
| `adminListBookings` | POST | password | All bookings with PII |
| `adminListRsvps` | POST | password | All RSVPs with PII |
| `adminListEvents` | POST | password | Audit trail |
| `adminCancelBooking` | POST | password | Deletes booking, logs `cancelled_by_admin` |

**Auth mechanism.** `ADMIN_PASSWORD` is read from env with a hardcoded fallback
(`booking.server.ts:130`). Each admin function compares the submitted string
directly. No sessions, no tokens, no rate limiting — the password travels in the
body of every admin request. See `04-constraints-risks.md`.

**Audit logging** is best-effort by design: `logEvent()` writes to
`booking_events` and, on failure, logs to console without failing the caller.
`bookings` remains the single source of truth for availability.

## Data modules

Configuration lives in typed TS modules, not in the database. Changing the
programme means a code change and a deploy.

### `src/data/timeslots.ts` (142 LOC)

| Export | Shape | Notes |
|---|---|---|
| `EVENT_DATE/TIME/VENUE/ADDRESS/MAP_URL` | strings | 2 Sep at Suntec L3 Room 302 |
| `TIMESLOTS` | `Timeslot[]` | Three rounds: `slot1` 14:00–14:30, `slot2` 14:50–15:20, `slot3` 15:30–16:00 |
| `ROUND3_COMPANY_SLUGS` | `string[]` | Gate for round 3. Currently all eight companies |
| `isSlotOffered(slug, id)` | fn | `true` unless `slot3` and slug not in the gate |
| `PROGRAM` | `ProgramBlock[]` | Showcase / lunch / meetups blocks shown on the RSVP form |
| `NULDAM_VENUE/ADDRESS/MAP_URL` | strings | SCAPE #02-14/15 |
| `NULDAM_TRACKS` | `NuldamTrack[]` | Track 1 (31 Aug) and Track 2 (4 Sep), four 40-min slots each |
| `NULDAM_COMPANY_SLUGS` | `Record<track, string[]>` | Track 1: cutshion, doublt, willog, xylolabs · Track 2: contrau-eco, haesong-snt |
| `isNuldamCompany(slug)` | fn | Drives CTA branching on company pages |
| `getSlotInfo(id)` | fn | Resolves any slot id to label/time/context for display |

### `src/data/companies.ts` (473 LOC)

Ten entries (eight participating companies plus supporting records), each with
slug, name, tagline, track, description, and one-pager content. `companyImages.ts`
maps slugs to imported image assets.

## Client-side structure

`src/components/ui/` holds 46 unmodified shadcn/ui primitives. Application UI is
written inline in the route files rather than extracted into feature components
— hence the 500–700 LOC route files. There is no shared layout component; the
navbar and footer are duplicated across `index`, `book`, `meet`, and
`companies/$slug`, which is why a logo resize touches four files.

`src/lib/supabase-client.ts` creates the browser client (anon key) used only for
realtime subscriptions and `booked_slots` reads.

## Live-update strategy

Both booking pages and the admin dashboard use the same belt-and-braces pattern:
a Supabase realtime channel subscribed to `postgres_changes`, **plus** an
interval poll as fallback.

| Page | Channel | Tables watched | Poll |
|---|---|---|---|
| `/book` | `book-availability` | `bookings` | 30 s |
| `/meet` | `meet-availability` | `bookings` | — |
| `/admin` | `admin-bookings` | `bookings`, `booking_events`, `rsvps` | 20 s |

## Build and deploy

`npx tsc --noEmit` for typecheck, `npx vite build` for the bundle. Vercel builds
on push to `main`. Environment variables required at build/runtime:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`.
