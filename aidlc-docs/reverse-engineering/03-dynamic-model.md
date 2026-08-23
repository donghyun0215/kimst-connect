# 03 — Dynamic Model

*Runtime behaviour of the four principal flows.*

---

## Flow A — RSVP with optional 1:1 meetings (`/book`)

The primary path. One submission does two different things: an idempotent
upsert, and up to three non-idempotent inserts.

```
Visitor                    /book (client)              createRsvp (server)         Postgres
   │                            │                             │                       │
   │─ open (?company=slug) ────►│                             │                       │
   │                            │─ fetchBookedSlots ─────────►│─ select bookings ────►│
   │                            │◄──── taken pairs ───────────│◄──────────────────────│
   │                            │  greys out taken cells;                             │
   │                            │  if ?company, preselects first offered free slot     │
   │                            │                             │                       │
   │─ fill form, tick blocks ──►│                             │                       │
   │─ pick company per round ──►│  (companions field appears only if meetups ticked)  │
   │─ submit ──────────────────►│─ createRsvp(payload) ──────►│                       │
   │                            │                             │─ validate required ──│
   │                            │                             │─ ≥1 block selected? ─│
   │                            │                             │─ upsert rsvps ───────►│
   │                            │                             │   onConflict: email   │
   │                            │                             │                       │
   │                            │                    for each selection (max 3):      │
   │                            │                             │─ insert bookings ────►│
   │                            │                             │   ok  → logEvent      │
   │                            │                             │   23505 → typed error │
   │                            │◄─ { rsvpOk, bookingResults[] } ─────────────────────│
   │◄── per-slot success/failure ┤                             │                       │
```

**Partial success is a first-class outcome.** The RSVP is committed before any
booking is attempted, and each booking is independent — one slot lost to a race
does not void the RSVP or the other slots. The UI reports per-slot results.

**There is no transaction.** If the process died between the upsert and the
inserts, the attendee would be registered with no meetings. Acceptable given the
scale; worth stating explicitly.

**Re-submission is the edit mechanism.** Same email → RSVP fields overwritten.
But bookings are *inserted*, not reconciled: re-submitting with the same slot
returns `already_booked_this_session` rather than being recognised as "no
change". Users are told to re-submit to update details, so this collision is
routine and the error text is slightly misleading in that context.

---

## Flow B — Nuldam 40-minute booking (`/meet`)

```
Visitor ──► /meet ──► accordion per company (track 1 / track 2)
                          │
                          ├─ fetchBookedSlots ──► grey out taken
                          ├─ realtime channel "meet-availability" on bookings
                          │
                          └─ pick slot ──► modal (name, org, title, email, phone, notes)
                                              │
                                              └─ createBooking ──► insert bookings
                                                                     ├─ ok → logEvent("booked")
                                                                     ├─ 23505 company_timeslot → "slot_taken"
                                                                     └─ 23505 email_timeslot   → "already_booked_this_session"
```

Structurally simpler than Flow A: one slot, one insert, no RSVP row. Same table,
same constraints — a Nuldam booking and a 2 Sep booking are the same kind of
object distinguished only by `timeslot_id`.

---

## Flow C — Self-service lookup and cancel (`/book`)

```
Visitor ─ enter email ─► lookupBookingsByEmail ─► select where email = ?
        ◄── their bookings ──┤
        ─ cancel one ───────► selfCancelBooking(email, id)
                                 │ delete where id = ? AND email = ?   ← ownership check
                                 │ logEvent("cancelled_by_user")
                                 └─ slot returns to the pool
```

Authorisation is "knows the email address". Anyone who knows a booker's email
can list and cancel their meetings. Accepted for a small invite-driven event;
recorded in `04-constraints-risks.md`.

---

## Flow D — Admin dashboard (`/admin`)

```
Organiser ─ password ─► adminListBookings / adminListRsvps / adminListEvents
                            │ each re-checks password === ADMIN_PASSWORD
                            └─ full PII returned
          ◄── grid + tables ─┤
          │
          ├─ realtime: bookings, booking_events, rsvps  +  20 s poll
          │
          └─ cancel a cell ─► window.confirm("Cancel {name}'s booking with
                              {company} ({round})? The slot will reopen…")
                                 │ adminCancelBooking(password, id)
                                 │ delete + logEvent("cancelled_by_admin")
                                 └─ no undo — recovery is manual re-entry
                                    using the audit log
```

The password is held in a ref and re-sent with every call; there is no session.
A page refresh means re-entering it.

Derived displays: the booking grid shows `—` for `(company, round)` pairs where
`isSlotOffered` is false; total capacity is computed as the count of offered
pairs rather than `companies × rounds`. RSVP rows show
`+N: {additional_attendees}` and the header stat reads
`Total RSVPs: X (+N guests)`.

---

## State transitions of a slot

```
        ┌─────────── available ◄───────────┐
        │                │                 │
        │          booking insert          │ delete
        │                ▼                 │ (self or admin)
        └──────────── occupied ────────────┘
```

Only two states, and both transitions write an event to `booking_events`. There
is no "held" or "pending" state — an insert either wins the unique constraint or
loses it. Concurrency is resolved by Postgres, not by application locking, which
is why two people clicking the same slot simultaneously produces exactly one
booking and one clean `slot_taken` message.
