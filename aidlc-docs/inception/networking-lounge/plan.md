# Virtual Networking Lounge — Construction Plan

- **Status:** Awaiting approval — no code until sign-off
- **Depends on:** requirements.md in this folder

## Units of work (in order)

### U1 — Schema + drift repair *(SQL first, per C4)*
1. Append to `supabase/schema.sql`: `additional_attendees` (drift fix, R3),
   `linkedin_url`, `show_in_lounge` — all idempotent.
2. Owner runs the two new ALTERs in Supabase SQL editor and confirms.
3. Only then does any dependent code deploy. Gate: **hard stop** until confirmed.

### U2 — RSVP form capture
`/book`: add optional "LinkedIn profile URL" input and a "Show my card in the
attendee networking lounge" checkbox (default checked) near the companions
field. `createRsvp` passes both through. Backward compatible — U1 already live.

### U3 — Lounge API
New server fn `listLoungeProfiles({ key? , email? })`:
- Authorise if `key === LOUNGE_ACCESS_KEY` (env, no hardcoded fallback — avoid
  repeating R1) **or** the email matches an existing RSVP row.
- Return only: full_name, organisation, job_title, primary_interest,
  linkedin_url — filtered to `show_in_lounge = true`. Never email/phone.

### U4 — `/lounge` page
Unlisted route (noindex, no nav links — same posture as `/schedule`).
Gate screen (email input) unless a valid `?key=` is present. Card wall in site
theme: initials avatar, name, org, title, interest chip, LinkedIn button.
Mobile-first — event-day usage is phones from a QR scan.

### U5 — Rollout kit
Generate printable QR (PNG, A5) pointing at `/lounge?key=…`; draft the reminder
blurb (Korean + English) announcing the lounge and the LinkedIn re-submit path;
draft Tammy briefing note.

## Verification
tsc + build per unit; dev-server curl for U4 (gate present, no PII in payload);
manual: email gate with a real RSVP email, key path, opt-out hidden.

## Risks
- QR leaks beyond attendees → token rotation (US-6) is the containment.
- Low LinkedIn fill-rate → reminder copy + optional manual backfill.
