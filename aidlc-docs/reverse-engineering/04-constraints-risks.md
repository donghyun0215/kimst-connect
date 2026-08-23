# 04 — Constraints, Risks, and Known Gaps

*Findings from the reverse-engineering pass. Recorded, not yet acted on — acting
on any of these requires its own plan and approval.*

## Hard constraints (do not violate)

| # | Constraint | Source |
|---|---|---|
| C1 | Never rewrite published git history (no force push, rebase, amend, squash of pushed commits) | `AGENTS.md` — Lovable syncs from the branch |
| C2 | `lodestart_v4/` is a separate project; do not modify | Established working agreement |
| C3 | `ksc/` must stay mirrored with `src/` until it is retired | Divergence would create a confusing second source of truth |
| C4 | A deploy that needs a new DB column must not ship before the column exists | Learned from incident I1 below |
| C5 | The event is live and taking real bookings — `main` must stay in a working state at all times | Deployed continuously to the URL shared with partners |

## Incident on record

**I1 — RSVP outage (Aug 2026).** Code writing `additional_attendees` was pushed
before the column was added to the database. Every RSVP submission failed. It
surfaced when an investor introduced by a partner tried to register. Resolved by
reverting the commit, adding the column by hand, then re-applying.

Root cause was ordering, not the change itself: schema and application code live
in different places and are deployed by different mechanisms (git push vs. manual
SQL), with nothing enforcing sequence.

## Risks

### R1 — Admin authentication is a shared password with a hardcoded fallback
`booking.server.ts:130` defaults to a literal string if `ADMIN_PASSWORD` is
unset. The password is sent in the body of every admin request, there is no
session, no lockout, and no rate limiting. Anyone with it can read all attendee
PII and delete any booking.
*Severity: high. Mitigations are cheap (env-only, rate limit, session token).*

### R2 — Self-service cancel authorises on email alone
Knowing a booker's email is sufficient to list and cancel their meetings
(`selfCancelBooking`). No token, no confirmation step from the address.
*Severity: medium; low likelihood at this event's scale.*

### R3 — Schema drift between `supabase/schema.sql` and production
`additional_attendees` exists in the database but not in the file. The file can
no longer rebuild the schema, and no migration history exists.
*Severity: medium — it is the mechanism behind I1 recurring.*

### R4 — No migration pipeline
Schema changes are applied by hand in the Supabase SQL editor. A GitHub Actions
workflow (`migrations/*.sql` + `psql`) was drafted and abandoned because the
fine-grained PAT lacked the **Workflows** scope, and `SUPABASE_DB_URL` was never
added as a repository secret.
*Blocked on: token scope + secret. Both are minutes of work when wanted.*

### R5 — Round/track eligibility is enforced client-side only
`isSlotOffered` and `NULDAM_COMPANY_SLUGS` gate the UI, but `createBooking`
re-checks neither. A crafted POST can create a booking for a company in a round
it was never offered.
*Severity: low impact, trivial fix (validate in the server function).*

### R6 — Duplicated layout across four routes
Navbar and footer are inline in `index`, `book`, `meet`, and `companies/$slug`.
Every logo or nav change is a four-file edit, and drift between them has already
happened.
*Severity: low, but it is the main source of avoidable churn.*

### R7 — Programme data is compiled into the bundle
Venues, dates, rosters and slot definitions live in `src/data/*.ts`. Every
organiser-driven change (a venue move, a company swap, a new round) requires a
code edit, a build, and a deploy. Ten such changes have already occurred.
*Severity: low technical risk, high operational friction. A candidate for an
admin-editable config if churn continues.*

### R8 — No automated tests
There is no test suite. Correctness rests on typecheck, a local build, and
manual checks against the running dev server. The booking constraints — the part
where a bug costs a real meeting — are unverified by any automated check.
*Severity: medium.*

### R9 — No transaction around RSVP + bookings
`createRsvp` upserts, then inserts bookings in a loop. A mid-flight failure
leaves an RSVP with no meetings and no compensating action.
*Severity: low at current volume; accepted deliberately.*

### R10 — `/schedule` is unlisted, not private
Not linked anywhere and marked `noindex`, but anyone with the URL can read the
full delegation itinerary including venues and headcounts.
*Severity: low; a password gate is available if the organiser wants it.*

## Operational notes for future sessions

- **Container resets wipe `node_modules` and git identity.** Re-run
  `npm install` and set `user.email` / `user.name` before committing.
- **Build verification sequence:** `npx tsc --noEmit` → `npx vite build` →
  (optional) dev server + curl for rendered-output checks.
- **Mirror `src/` → `ksc/` before every commit** while C3 holds.
- **Remove `.env`, `node_modules`, `dist`, `.vercel`, `.tanstack`, `.nitro`
  before `git add -A`.**
