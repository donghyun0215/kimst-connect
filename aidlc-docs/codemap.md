# Codemap — kimst-connect

Read this first, then open only the files the task touches. Regenerate with
`python3 scripts/codemap.py .` after adding routes, tables, or env vars.

- Generated at: 1fbe34c 2026-09-11 fix(admin): keep cohort startups and organizers out of the outreach funnel
- Files mapped: 93 · code LOC: 14,229
- Scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`
- Deps: @hookform/resolvers, @radix-ui/react-accordion, @radix-ui/react-alert-dialog, @radix-ui/react-aspect-ratio, @radix-ui/react-avatar, @radix-ui/react-checkbox, @radix-ui/react-collapsible, @radix-ui/react-context-menu, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-hover-card, @radix-ui/react-label, @radix-ui/react-menubar, @radix-ui/react-navigation-menu, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-select, @radix-ui/react-separator, @radix-ui/react-slider, @radix-ui/react-slot, @radix-ui/react-switch, @radix-ui/react-tabs, @radix-ui/react-toggle, @radix-ui/react-toggle-group, @radix-ui/react-tooltip, @supabase/supabase-js, @tailwindcss/vite, @tanstack/react-query, @tanstack/react-router, @tanstack/react-start, @tanstack/router-plugin, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, input-otp, lucide-react …

## Routes (pages)
- `/` → src/routes/index.tsx (508 LOC)
- `/admin` → src/routes/admin.tsx (911 LOC)
- `/book` → src/routes/book.tsx (746 LOC)
- `/companies/$slug` → src/routes/companies/$slug.tsx (289 LOC)
- `/lounge` → src/routes/lounge.tsx (1633 LOC)
- `/meet` → src/routes/meet.tsx (531 LOC)
- `/schedule` → src/routes/schedule.tsx (778 LOC)

## Server functions (TanStack createServerFn)
- src/lib/booking.server.ts: `createBooking`, `fetchBookedSlots`, `lookupBookingsByEmail`, `selfCancelBooking`, `adminListBookings`, `adminCancelBooking`, `adminListEvents`, `createRsvp`, `adminListRsvps`, `lookupRsvpByEmail`, `listLoungeProfiles`, `updateContactUrl`, `fetchMeetingRoster`, `markLoungeCheckIn`, `adminSetCheckedIn`, `listMyContacts`, `addLoungeContact`, `removeLoungeContact`, `saveLoungeContactInfo`, `addCustomContact`, `updateCustomContact`, `removeCustomContact`, `listTeamContacts`

## Data
- table `booking_events` — defined in supabase/schema.sql
- table `bookings` — defined in supabase/schema.sql
- table `lounge_contacts` — defined in supabase/schema.sql (+custom_name, custom_org, custom_title, note)
- table `rsvps` — defined in supabase/schema.sql (+additional_attendees, checked_in_at, checked_in_via, contact_url, show_in_lounge)
- Supabase tables touched in code: `rsvps`×17, `bookings`×10, `lounge_contacts`×8, `booking_events`×2, `booked_slots`×2

## Environment variables
- `ADMIN_PASSWORD`, `LOUNGE_ACCESS_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Biggest files (open these surgically — grep for the symbol, don't cat)
- src/routes/lounge.tsx — 1633 LOC
- src/lib/booking.server.ts — 1003 LOC
- src/routes/admin.tsx — 911 LOC
- src/routes/schedule.tsx — 778 LOC
- src/routes/book.tsx — 746 LOC
- src/components/ui/sidebar.tsx — 744 LOC
- src/routes/meet.tsx — 531 LOC
- src/routes/index.tsx — 508 LOC
- src/data/companies.ts — 473 LOC
- src/components/ui/chart.tsx — 331 LOC
- src/routes/companies/$slug.tsx — 289 LOC
- src/lib/reminders.ts — 267 LOC

## Exports by file
- **scripts/codemap.py** (165): rel_files, loc, read, scan, tree, main
- **scripts/generate-onepager-pdfs.py** (244): wrap_text, draw_company
- **src/components/ui/badge.tsx** (32): BadgeProps
- **src/components/ui/button.tsx** (49): ButtonProps
- **src/components/ui/chart.tsx** (331): ChartConfig
- **src/data/companies.ts** (473): Company, TRACKS, companies, getCompanyBySlug
- **src/data/companyImages.ts** (39): STARTUP_IMAGES, STARTUP_LOGOS
- **src/data/timeslots.ts** (147): EVENT_ADDRESS, EVENT_DATE, EVENT_MAP_URL, EVENT_TIME, EVENT_VENUE, NULDAM_ADDRESS, NULDAM_COMPANY_SLUGS, NULDAM_MAP_URL, NULDAM_TRACKS, NULDAM_VENUE, NuldamTrack, PROGRAM, ProgramBlock, ROUND3_COMPANY_SLUGS, SlotInfo, TIMESLOTS, Timeslot, getSlotInfo …
- **src/hooks/use-mobile.tsx** (19): useIsMobile
- **src/lib/booking.server.ts** (1003): AdminBooking, AdminRsvp, BookingEvent, BookingInput, BookingResult, LoungeProfile, MyBooking, RosterEntry, RsvpInput, RsvpResult, TeamContactEntry, WalletEntry, addCustomContact, addLoungeContact, adminCancelBooking, adminListBookings, adminListEvents, adminListRsvps …
- **src/lib/error-capture.ts** (27): consumeLastCapturedError
- **src/lib/error-page.ts** (30): renderErrorPage
- **src/lib/lovable-error-reporting.ts** (36): reportLovableError
- **src/lib/reminders.ts** (267): Reminder, buildReminders, remindersToCsv
- **src/lib/supabase-admin.server.ts** (17): supabaseAdmin
- **src/lib/supabase-client.ts** (12): supabase
- **src/lib/thankyou.ts** (94): ThankYouEmail, buildThankYous, thankYousToCsv
- **src/lib/utils.ts** (6): cn
- **src/router.tsx** (16): getRouter
- **src/routes/__root.tsx** (126): Route
- **src/routes/admin.tsx** (911): Route
- **src/routes/book.tsx** (746): Route
- **src/routes/companies/$slug.tsx** (289): Route
- **src/routes/index.tsx** (508): Route
- **src/routes/lounge.tsx** (1633): Route
- **src/routes/meet.tsx** (531): Route
- **src/routes/schedule.tsx** (778): Route
- **src/start.ts** (22): startInstance

## Tree (depth 3)
```
AGENTS.md
aidlc-docs/
  README.md
  audit.md
  decisions/
    ADR-000-adopting-aidlc.md
  inception/
    networking-lounge/
  reverse-engineering/
    00-overview.md
    01-static-model.md
    02-data-model.md
    03-dynamic-model.md
    04-constraints-risks.md
bunfig.toml
components.json
eslint.config.js
package.json
scripts/
  codemap.py
  generate-onepager-pdfs.py
src/
  components/
    ui/
  data/
    companies.ts
    companyImages.ts
    timeslots.ts
  hooks/
    use-mobile.tsx
  lib/
    booking.server.ts
    error-capture.ts
    error-page.ts
    lovable-error-reporting.ts
    reminders.ts
    supabase-admin.server.ts
    supabase-client.ts
    thankyou.ts
    utils.ts
  router.tsx
  routes/
    README.md
    __root.tsx
    admin.tsx
    book.tsx
    companies/
    index.tsx
    lounge.tsx
    meet.tsx
    schedule.tsx
  server.ts
  start.ts
  styles.css
supabase/
  schema.sql
tsconfig.json
vite.config.ts
```
