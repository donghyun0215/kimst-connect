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

---

## 2026-08-23 — Networking Lounge: Inception approved, Construction staged

**Approved with amendments** (recorded in `inception/networking-lounge/plan.md`):
contact_url replaces linkedin_url; lounge-gate mini-form for low-friction
updates (doubles as organiser backfill); default visibility ON; guests excluded.

**Built on branch `feat/networking-lounge`** (not merged — C4 gate):
- U1: `supabase/schema.sql` gains `additional_attendees` (drift repair, R3),
  `contact_url`, `show_in_lounge` — committed to main; ALTERs pending in prod.
- U2: `/book` captures contact link + lounge opt-out; `createRsvp` passes both.
- U3: `listLoungeProfiles` (key OR rsvp-email auth; returns name/org/title/
  interest/contact only — never email/phone), `updateContactUrl`.
  `LOUNGE_ACCESS_KEY` from env with **no fallback**.
- U4: unlisted `/lounge` — gate screen, card wall (initials avatar, interest
  chip, contact button), mini-form. noindex, zero nav links.

Verified: vite build ✓, tsc ✓, gate renders ✓, /book field ✓, landing has no
/lounge reference ✓.

**Merge gate:** branch merges to main only after the owner confirms the two
ALTER statements ran in production. U5 (QR asset, reminder copy) follows the
merge.

---

## 2026-08-24 — Lounge mobile fix + Reminder email generator

**Mobile (reported via KakaoTalk in-app browser screenshots):** page rendered
zoomed-out/desktop-width. Hardened `/lounge` mobile-first: `overflow-x-hidden`
root guard (prevents webview fit-zoom from any overflowing child), header
compaction with truncation, card role/org now wraps two lines (line-clamp)
instead of clipping, detail modal becomes a bottom sheet on phones
(`items-end`, `max-h-[88dvh]`, scrollable), 16px inputs (kills iOS focus-zoom),
full-width tap targets.

**Reminders (small-cycle feature, owner-approved option 1):** new
`src/lib/reminders.ts` — joins RSVPs with bookings by email and renders one
personalised plain-text email per attendee: showcase/lunch blocks from PROGRAM,
2-Sep 1:1 meetings with company + round + time, Nuldam meetings under "Also on
your calendar", companion badge line, lounge/LinkedIn plug, change-booking
link; "slots still open" nudge when no day meeting. Admin gains a "Reminder
Emails" section: per-person Copy / mailto, CSV download (email,name,subject,
body) for Gmail mail merge. English only per owner. No sending from the app —
scope limit reaffirmed.

Verified: tsc ✓ build ✓; generator smoke-tested against three attendee shapes
(full / RSVP-only / Nuldam-only) with real slot ids.

---

## 2026-08-24 — Lounge UI pass (wide layout + directory controls)

**Problem:** on desktop the wall sat in a 1024px column with dead margins both
sides, and cards read as sparse.

**Approach:** the empty space was spent on function, not decoration. Container
widened to `max-w-7xl` with a two-column shell at `lg` — a sticky left rail
plus a 1/2/3-column card grid.

- **Rail:** search across name/company/role; a "Who's here" composition list
  (interest categories with counts and proportional bars) where each row is
  also the filter; "has a contact link" toggle; the add/update-link form moved
  here from the header. On phones the rail degrades to a search field plus a
  horizontally scrolling chip row.
- **Cards:** role and organisation split onto separate lines (org in a distinct
  weight), avatars re-keyed to a cool marine palette so 57 tiles read as one
  wall rather than a rainbow, interest chips gain ring outlines, hover lift and
  visible focus ring retained.
- **Fixed:** `CHIP_COLORS` keys never matched the real `primary_interest`
  values from the RSVP form, so every chip except Investment fell through to
  the default grey. Now keyed to the four actual options.
- **Empty state:** filters that match nobody get a direction and a clear action
  rather than a blank grid.

Verified: tsc ✓ build ✓ dev-server render ✓ (no visual regression testing
available in this environment — owner to eyeball).

---

## 2026-08-24 — Lounge entry screen + privacy notice (client request)

**From Tammy (KakaoTalk):** scanning the QR flew past the first screen too
quickly; she asked for a deliberate entry step and a privacy notice beneath it.

- QR arrivals no longer auto-authenticate. The key is held and a welcome card
  is shown — event eyebrow, lounge title, one line on what it is, and an
  "Enter Virtual Networking Lounge" button that performs the load.
- New `LoungeNotice` renders under **both** entry paths (QR and email gate):
  what the directory shows, exclusive access, no direct contact info, and the
  data-management route (in-lounge link form or support@lodestart.ai).
- In-lounge footer line now carries the same support address so opt-out is
  actionable from inside too.

Verified: tsc ✓ build ✓; QR path renders the button and does not enter on load;
notice present on both paths.

---

## 2026-08-24 — Entry screen wording (client markup)

**From Tammy:** "Virtual Networking Lounge" appeared three times on one screen
(header, card title, button). She marked up the header for deletion and
sketched the screen as a single welcome headline with a short button.

- Header title block now renders only once inside the lounge; on the entry
  screens the card carries the name, so the header is logo-only.
- Welcome card headline: "Welcome to the Virtual Networking Lounge"
  (uppercase display, two lines); button shortened to "Enter the lounge".
- Both entry cards gained a faint marine glyph watermark (waves, hull, buoy,
  rotor) at ~4.5% opacity, per her mock — subject vocabulary, quiet enough that
  the headline stays dominant.

Verified: tsc ✓ build ✓; entry screen renders the title once, header duplicate
absent, notice intact.
