# Virtual Networking Lounge — Requirements

- **Status:** Draft — awaiting approval
- **Requested:** 2026-08-23 by Donghyun (feature owner), for KIMST 2 Sep event
- **Phase:** Inception

## Intent

Attendees of the 2 Sep Open Innovation Day cannot see each other today — only
the admin can. Give attendees a digital business-card wall ("Virtual Networking
Lounge") so networking continues during and after the event, without building
chat and without exposing sensitive contact data.

## User stories

- **US-1** As an attendee on event day, I scan a QR code at the entrance and see
  the attendee wall immediately, with no typing.
- **US-2** As an attendee after the event, I enter the email I used to RSVP and
  see the same wall.
- **US-3** As an attendee, my card shows my name, organisation, job title, and
  interest area — never my email or phone.
- **US-4** As an attendee who wants inbound contact, I add my LinkedIn URL and a
  LinkedIn button appears on my card; others DM me there.
- **US-5** As a non-attendee, I cannot view the lounge: no QR token and my email
  has no RSVP.
- **US-6** As the organiser, I can rotate/disable the QR token after the event
  so only the email gate remains.

## Card contents

Avatar = generated initials (no photos). Name, organisation, job title,
`primary_interest` as a coloured chip (Investor / Distributor / Partner …),
LinkedIn button when provided. Nothing else. `additional_attendees` guests are
out of scope for v1 (no own org/title records).

## Access model

| Path | Mechanism | Lifetime |
|---|---|---|
| Event day | `/lounge?key=<token>` from printed QR | Until token rotated post-event |
| Post-event | Enter RSVP email → server verifies an RSVP row exists | Indefinite |

Both are soft gates consistent with the site's existing trust model (R2 in
`04-constraints-risks.md`): possession of the URL token or knowledge of a
registered email. Accepted for this event's scale; the server must still never
return email/phone fields to the lounge, so a gate bypass leaks only what a
name badge already shows.

## Data & privacy decisions

1. **Emails and phone numbers are never displayed nor returned by the lounge
   API.** The RSVP privacy notice covers event-purpose use; publishing contact
   details to other attendees would exceed it (PDPA). Non-negotiable.
2. **LinkedIn is opt-in by provision:** a new optional `linkedin_url` field on
   the RSVP form. Existing attendees update via the established
   re-submit-with-same-email mechanism; the pre-event reminder will say so.
   Organiser may manually backfill a few key profiles on request.
3. **Lounge visibility default ON** (`show_in_lounge boolean default true`) with
   clear label text on the form ("Show my card in the attendee networking
   lounge") and an unchecked path for those who opt out. Name/org/title among
   fellow attendees is within the event's reasonable expectations; LinkedIn is
   the only added datum and is self-provided.

## Non-goals

No chat, no photo upload, no accounts/passwords for attendees, no
search/filtering in v1 (≤ ~60 cards renders fine as one wall), no guest cards.

## Schema impact (triggers C4 ordering rule)

```sql
alter table rsvps add column if not exists linkedin_url text;
alter table rsvps add column if not exists show_in_lounge boolean not null default true;
```

Must be applied to production **and** committed to `supabase/schema.sql`
*before* the application deploy — this change is also the vehicle to fix drift
R3 (add the missing `additional_attendees` line to the file at the same time).
