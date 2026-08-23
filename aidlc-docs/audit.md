# Audit Log

Chronological record of AI-DLC sessions: what was requested, what was produced,
and what was approved.

---

## 2026-08-23 — Phase 0: Reverse engineering

**Requested:** Apply AI-DLC to the repository. Create `aidlc-docs/` and, before
anything else, reverse-engineer the existing system — component structure,
routes, Supabase schema, and the main user flows (RSVP, 1:1 booking, admin) —
into static and dynamic models. Do not proceed past this step without approval.

**Baseline:** commit `cd1aca6`.

**Method:** read `src/routes/*`, `src/lib/booking.server.ts`, `src/data/*`, and
`supabase/schema.sql` directly. No runtime database access was available from
the working environment, so the data model is derived from the committed DDL
plus one column known to have been applied by hand.

**Produced:**

| Artefact | Contents |
|---|---|
| `README.md` | Purpose of the folder, working agreement, phase status |
| `reverse-engineering/00-overview.md` | Purpose, actors, boundaries, deployment topology, stack |
| `reverse-engineering/01-static-model.md` | Route tree, server function inventory, data modules, live-update strategy |
| `reverse-engineering/02-data-model.md` | Tables, constraints, view, realtime, invariants, schema drift |
| `reverse-engineering/03-dynamic-model.md` | Sequence flows A–D, slot state machine, concurrency behaviour |
| `reverse-engineering/04-constraints-risks.md` | 5 hard constraints, 1 incident, 10 risks, operational notes |
| `decisions/ADR-000-adopting-aidlc.md` | The decision to adopt this methodology |

**Notable findings:**

- Schema drift: `additional_attendees` is in production but not in
  `supabase/schema.sql`, so the file can no longer rebuild the schema (R3).
- Booking correctness rests entirely on two Postgres unique constraints, and the
  user-facing error messages are keyed off those constraint *names* — renaming
  one degrades the messaging silently.
- Round and track eligibility are enforced in the UI only; the server function
  does not re-check them (R5).
- Admin auth is a shared password with a hardcoded fallback, re-sent on every
  request, with no session or rate limiting (R1).

**Code changed:** none. Documentation only.

**Status:** ⏸ Awaiting review. No Inception or Construction work begins until
the approver signs off on these models.
