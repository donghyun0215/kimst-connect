import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "./supabase-admin.server";

export interface BookingInput {
  companySlug: string;
  timeslotId: string;
  fullName: string;
  organisation: string;
  jobTitle: string;
  email: string;
  phone: string;
  primaryInterest: string;
  notes?: string;
}

export type BookingResult =
  | { ok: true }
  | { ok: false; error: "slot_taken" | "already_booked_this_session" | "unknown"; message: string };

type EventType = "booked" | "cancelled_by_user" | "cancelled_by_admin";

interface EventSnapshot {
  booking_id: string;
  company_id: string;
  timeslot_id: string;
  full_name: string;
  organisation: string | null;
  email: string;
}

// Best-effort audit log write — never blocks or fails the booking/cancel
// operation itself. The `bookings` row (or DB unique constraints) is always
// the source of truth for availability; this table is a read-only trail.
async function logEvent(eventType: EventType, snapshot: EventSnapshot) {
  const { error } = await supabaseAdmin.from("booking_events").insert({
    event_type: eventType,
    booking_id: snapshot.booking_id,
    company_id: snapshot.company_id,
    timeslot_id: snapshot.timeslot_id,
    full_name: snapshot.full_name,
    organisation: snapshot.organisation,
    email: snapshot.email,
  });
  if (error) {
    console.error(`logEvent(${eventType}) error:`, error);
  }
}

export const createBooking = createServerFn({ method: "POST" })
  .validator((data: BookingInput) => data)
  .handler(async ({ data }): Promise<BookingResult> => {
    const {
      companySlug,
      timeslotId,
      fullName,
      organisation,
      jobTitle,
      email,
      phone,
      primaryInterest,
      notes,
    } = data;

    if (!companySlug || !timeslotId || !fullName || !organisation || !jobTitle || !email || !phone) {
      return { ok: false, error: "unknown", message: "Missing required fields." };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: inserted, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        company_id: companySlug,
        timeslot_id: timeslotId,
        full_name: fullName,
        organisation,
        job_title: jobTitle,
        email: normalizedEmail,
        phone,
        primary_interest: primaryInterest,
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (error) {
      // Postgres unique_violation
      if (error.code === "23505") {
        if (error.message.includes("bookings_company_timeslot_key")) {
          return {
            ok: false,
            error: "slot_taken",
            message: "Someone just booked this slot. Please pick another one.",
          };
        }
        if (error.message.includes("bookings_email_timeslot_key")) {
          return {
            ok: false,
            error: "already_booked_this_session",
            message: "This email already has a meeting booked in this session.",
          };
        }
        return { ok: false, error: "slot_taken", message: "This slot is no longer available." };
      }
      console.error("createBooking error:", error);
      return { ok: false, error: "unknown", message: "Something went wrong. Please try again." };
    }

    await logEvent("booked", {
      booking_id: inserted.id,
      company_id: companySlug,
      timeslot_id: timeslotId,
      full_name: fullName,
      organisation,
      email: normalizedEmail,
    });

    return { ok: true };
  });

export const fetchBookedSlots = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("bookings").select("company_id, timeslot_id");
  if (error) {
    console.error("fetchBookedSlots error:", error);
    return [] as { company_id: string; timeslot_id: string }[];
  }
  return data;
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "lodestart.ai";

export interface MyBooking {
  id: string;
  company_id: string;
  timeslot_id: string;
  full_name: string;
  created_at: string;
}

export const lookupBookingsByEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }): Promise<MyBooking[]> => {
    const email = data.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) return [];
    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select("id, company_id, timeslot_id, full_name, created_at")
      .eq("email", email)
      .order("timeslot_id", { ascending: true });
    if (error) {
      console.error("lookupBookingsByEmail error:", error);
      return [];
    }
    return rows as MyBooking[];
  });

export const selfCancelBooking = createServerFn({ method: "POST" })
  .validator((data: { email: string; id: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const email = data.email?.toLowerCase().trim();
    if (!email || !data.id) return { ok: false };
    // Delete only if the booking id belongs to this email — the email acts
    // as the owner check, so nobody can cancel someone else's booking by id.
    const { data: deleted, error } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("id", data.id)
      .eq("email", email)
      .select("id, company_id, timeslot_id, full_name, organisation, email");
    if (error) {
      console.error("selfCancelBooking error:", error);
      return { ok: false };
    }
    const row = deleted?.[0];
    if (!row) return { ok: false };

    await logEvent("cancelled_by_user", {
      booking_id: row.id,
      company_id: row.company_id,
      timeslot_id: row.timeslot_id,
      full_name: row.full_name,
      organisation: row.organisation,
      email: row.email,
    });

    return { ok: true };
  });

export interface AdminBooking {
  id: string;
  company_id: string;
  timeslot_id: string;
  full_name: string;
  organisation: string;
  job_title: string;
  email: string;
  phone: string;
  primary_interest: string | null;
  notes: string | null;
  created_at: string;
}

export const adminListBookings = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; bookings: AdminBooking[] } | { ok: false }> => {
    if (data.password !== ADMIN_PASSWORD) {
      return { ok: false };
    }
    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("adminListBookings error:", error);
      return { ok: true, bookings: [] };
    }
    return { ok: true, bookings: rows as AdminBooking[] };
  });

export const adminCancelBooking = createServerFn({ method: "POST" })
  .validator((data: { password: string; id: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (data.password !== ADMIN_PASSWORD) {
      return { ok: false };
    }
    const { data: deleted, error } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("id", data.id)
      .select("id, company_id, timeslot_id, full_name, organisation, email");
    if (error) {
      console.error("adminCancelBooking error:", error);
      return { ok: false };
    }
    const row = deleted?.[0];
    if (!row) return { ok: false };

    await logEvent("cancelled_by_admin", {
      booking_id: row.id,
      company_id: row.company_id,
      timeslot_id: row.timeslot_id,
      full_name: row.full_name,
      organisation: row.organisation,
      email: row.email,
    });

    return { ok: true };
  });

export interface BookingEvent {
  id: string;
  event_type: EventType;
  booking_id: string;
  company_id: string;
  timeslot_id: string;
  full_name: string;
  organisation: string | null;
  email: string;
  created_at: string;
}

export const adminListEvents = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; events: BookingEvent[] } | { ok: false }> => {
    if (data.password !== ADMIN_PASSWORD) {
      return { ok: false };
    }
    const { data: rows, error } = await supabaseAdmin
      .from("booking_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("adminListEvents error:", error);
      return { ok: true, events: [] };
    }
    return { ok: true, events: rows as BookingEvent[] };
  });

// ── RSVP (showcase / lunch / meetups) ──────────────────────────

export interface RsvpInput {
  fullName: string;
  organisation: string;
  jobTitle: string;
  email: string;
  phone: string;
  primaryInterest: string;
  notes?: string;
  additionalAttendees?: string;
  contactUrl?: string;
  showInLounge?: boolean;
  attendShowcase: boolean;
  attendLunch: boolean;
  attendMeetups: boolean;
  meetupSelections: { timeslotId: string; companySlug: string }[];
}

export interface RsvpResult {
  rsvpOk: boolean;
  message?: string;
  bookingResults: { timeslotId: string; companySlug: string; ok: boolean; message?: string }[];
}

export const createRsvp = createServerFn({ method: "POST" })
  .validator((data: RsvpInput) => data)
  .handler(async ({ data }): Promise<RsvpResult> => {
    const email = data.email?.toLowerCase().trim();
    if (!data.fullName || !data.organisation || !data.jobTitle || !email || !data.phone) {
      return { rsvpOk: false, message: "Missing required fields.", bookingResults: [] };
    }
    if (!data.attendShowcase && !data.attendLunch && !data.attendMeetups) {
      return { rsvpOk: false, message: "Please select at least one session.", bookingResults: [] };
    }

    // Upsert by email — re-submitting updates your choices.
    const { error: rsvpError } = await supabaseAdmin.from("rsvps").upsert(
      {
        full_name: data.fullName,
        organisation: data.organisation,
        job_title: data.jobTitle,
        email,
        phone: data.phone,
        primary_interest: data.primaryInterest,
        notes: data.notes ?? null,
        additional_attendees: data.additionalAttendees?.trim() || null,
        contact_url: data.contactUrl?.trim() || null,
        show_in_lounge: data.showInLounge ?? true,
        attend_showcase: data.attendShowcase,
        attend_lunch: data.attendLunch,
        attend_meetups: data.attendMeetups,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );
    if (rsvpError) {
      console.error("createRsvp upsert error:", rsvpError);
      return { rsvpOk: false, message: "Something went wrong. Please try again.", bookingResults: [] };
    }

    // Book selected 1:1 meetups (each slot independent — one failing doesn't
    // void the RSVP or the other slot).
    const bookingResults: RsvpResult["bookingResults"] = [];
    if (data.attendMeetups) {
      for (const sel of data.meetupSelections.slice(0, 3)) {
        const { data: inserted, error } = await supabaseAdmin
          .from("bookings")
          .insert({
            company_id: sel.companySlug,
            timeslot_id: sel.timeslotId,
            full_name: data.fullName,
            organisation: data.organisation,
            job_title: data.jobTitle,
            email,
            phone: data.phone,
            primary_interest: data.primaryInterest,
            notes: data.notes ?? null,
          })
          .select("id")
          .single();

        if (error) {
          let message = "Something went wrong.";
          if (error.code === "23505") {
            message = error.message.includes("bookings_email_timeslot_key")
              ? "You already have a meeting in this round."
              : "Someone just booked this slot.";
          } else {
            console.error("createRsvp booking error:", error);
          }
          bookingResults.push({ ...sel, ok: false, message });
        } else {
          await logEvent("booked", {
            booking_id: inserted.id,
            company_id: sel.companySlug,
            timeslot_id: sel.timeslotId,
            full_name: data.fullName,
            organisation: data.organisation,
            email,
          });
          bookingResults.push({ ...sel, ok: true });
        }
      }
    }

    return { rsvpOk: true, bookingResults };
  });

export interface AdminRsvp {
  id: string;
  full_name: string;
  organisation: string;
  job_title: string;
  email: string;
  phone: string;
  primary_interest: string | null;
  notes: string | null;
  additional_attendees: string | null;
  contact_url: string | null;
  show_in_lounge: boolean;
  attend_showcase: boolean;
  attend_lunch: boolean;
  attend_meetups: boolean;
  checked_in_at: string | null;
  checked_in_via: string | null;
  created_at: string;
  updated_at: string | null;
}

export const adminListRsvps = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; rsvps: AdminRsvp[] } | { ok: false }> => {
    if (data.password !== ADMIN_PASSWORD) {
      return { ok: false };
    }
    const { data: rows, error } = await supabaseAdmin
      .from("rsvps")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("adminListRsvps error:", error);
      return { ok: true, rsvps: [] };
    }
    return { ok: true, rsvps: rows as AdminRsvp[] };
  });

export const lookupRsvpByEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }): Promise<{ attend_showcase: boolean; attend_lunch: boolean; attend_meetups: boolean } | null> => {
    const email = data.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) return null;
    const { data: row, error } = await supabaseAdmin
      .from("rsvps")
      .select("attend_showcase, attend_lunch, attend_meetups")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      console.error("lookupRsvpByEmail error:", error);
      return null;
    }
    return row;
  });

// ── Virtual Networking Lounge ──────────────────────────────────────
// Soft-gated attendee wall. Never returns email/phone — a gate bypass can
// only see what a name badge already shows.

const LOUNGE_ACCESS_KEY = process.env.LOUNGE_ACCESS_KEY; // no fallback on purpose

export interface LoungeProfile {
  id: string;
  full_name: string;
  organisation: string;
  job_title: string;
  primary_interest: string | null;
  contact_url: string | null;
}

export const listLoungeProfiles = createServerFn({ method: "POST" })
  .validator((data: { key?: string; email?: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; profiles: LoungeProfile[] } | { ok: false }> => {
    let authorised = false;
    if (data.key && LOUNGE_ACCESS_KEY && data.key === LOUNGE_ACCESS_KEY) {
      authorised = true;
    } else if (data.email) {
      const email = data.email.toLowerCase().trim();
      const { data: row } = await supabaseAdmin
        .from("rsvps")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      authorised = Boolean(row);
    }
    if (!authorised) return { ok: false };

    const { data: rows, error } = await supabaseAdmin
      .from("rsvps")
      .select("id, full_name, organisation, job_title, primary_interest, contact_url")
      .eq("show_in_lounge", true)
      .order("full_name", { ascending: true });
    if (error) {
      console.error("listLoungeProfiles error:", error);
      return { ok: false };
    }
    return { ok: true, profiles: rows ?? [] };
  });

// Update just the contact link for an existing RSVP — the low-friction path
// so attendees (or the organiser, on their behalf) never re-submit the form.
export const updateContactUrl = createServerFn({ method: "POST" })
  .validator((data: { email: string; contactUrl: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    const email = data.email?.toLowerCase().trim();
    if (!email) return { ok: false, message: "Email is required." };
    let url = data.contactUrl?.trim() ?? "";
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

    const { data: updated, error } = await supabaseAdmin
      .from("rsvps")
      .update({ contact_url: url || null, updated_at: new Date().toISOString() })
      .eq("email", email)
      .select("id");
    if (error) {
      console.error("updateContactUrl error:", error);
      return { ok: false, message: "Something went wrong. Please try again." };
    }
    if (!updated?.length) {
      return { ok: false, message: "No RSVP found with this email. Please RSVP first." };
    }
    return { ok: true };
  });

// ── 1:1 meeting roster for the internal schedule page ──────────────
// One-line attendee profiles per booking. Deliberately excludes email,
// phone and notes — the roster is for startups preparing their meetings.

export interface RosterEntry {
  company_id: string;
  timeslot_id: string;
  full_name: string;
  organisation: string;
  job_title: string;
  primary_interest: string | null;
  contact_url: string | null;
}

export const fetchMeetingRoster = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ entries: RosterEntry[] }> => {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("company_id, timeslot_id, full_name, organisation, job_title, primary_interest, email");
    if (error) {
      console.error("fetchMeetingRoster error:", error);
      return { entries: [] };
    }

    // Attach lounge contact links, but only for attendees who opted in.
    const { data: rsvps } = await supabaseAdmin
      .from("rsvps")
      .select("email, contact_url, show_in_lounge");
    const links = new Map<string, string | null>();
    for (const r of rsvps ?? []) {
      if (r.show_in_lounge && r.contact_url) links.set(String(r.email).toLowerCase(), r.contact_url);
    }

    // Email is used for the join only — it never leaves the server.
    const entries: RosterEntry[] = (data ?? []).map((b) => ({
      company_id: b.company_id,
      timeslot_id: b.timeslot_id,
      full_name: b.full_name,
      organisation: b.organisation,
      job_title: b.job_title,
      primary_interest: b.primary_interest,
      contact_url: links.get(String(b.email).toLowerCase()) ?? null,
    }));
    return { entries };
  },
);

// ── Attendance check-in (2026-08-30) ───────────────────────────────
// Only the on-site QR proves physical presence: check-in requires BOTH the
// lounge key (printed at the entrance desk) and a registered email. Remote
// email-only lounge entry never marks attendance. Idempotent — the first
// scan wins and later entries don't overwrite the timestamp.
export const markLoungeCheckIn = createServerFn({ method: "POST" })
  .validator((data: { key: string; email: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!LOUNGE_ACCESS_KEY || data.key !== LOUNGE_ACCESS_KEY) return { ok: false };
    const email = data.email?.toLowerCase().trim();
    if (!email) return { ok: false };
    const { error } = await supabaseAdmin
      .from("rsvps")
      .update({ checked_in_at: new Date().toISOString(), checked_in_via: "qr" })
      .eq("email", email)
      .is("checked_in_at", null);
    if (error) {
      console.error("markLoungeCheckIn error:", error);
      return { ok: false };
    }
    return { ok: true };
  });

// Manual override from /admin — staff can check people in (walk-ups whose
// phone died) or undo a mistaken check-in.
export const adminSetCheckedIn = createServerFn({ method: "POST" })
  .validator((data: { password: string; rsvpId: string; checked: boolean }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (data.password !== ADMIN_PASSWORD) return { ok: false };
    const patch = data.checked
      ? { checked_in_at: new Date().toISOString(), checked_in_via: "manual" }
      : { checked_in_at: null, checked_in_via: null };
    const { error } = await supabaseAdmin.from("rsvps").update(patch).eq("id", data.rsvpId);
    if (error) {
      console.error("adminSetCheckedIn error:", error);
      return { ok: false };
    }
    return { ok: true };
  });

// ── My Contacts wallet ("내 명함집") ────────────────────────────────
// 1:1 meeting partners are derived live from bookings — the source of truth
// stays in one place and pre-event cancellations never leave stale wallet
// rows. lounge_contacts stores only manual additions and the owner's own
// email/phone notes. Counterpart emails are revealed ONLY between pairs the
// bookings table actually connects; everyone else stays email-free exactly
// like the lounge wall.

// RSVP organisation strings are free-typed, so map each startup slug to the
// spellings seen in production data (normalised: lowercase, alphanumerics
// only). "WISE BIO Inc." → ys-bio etc.
const COMPANY_ORG_ALIASES: Record<string, string[]> = {
  cutshion: ["cutshion"],
  doublt: ["doublt", "doublet"],
  willog: ["willog"],
  xylolabs: ["xylolabs", "xylolab"],
  "eastsea-brother": ["eastseabrother", "eastseabro"],
  "haesong-snt": ["haesongsnt", "haesongst", "haesong"],
  "contrau-eco": ["contraueco", "contrau"],
  "ys-bio": ["ysbio", "wisebio", "wisebioinc", "wisebioink"],
};

function normOrg(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function slugForOrg(org: string): string | null {
  const n = normOrg(org);
  if (!n) return null;
  for (const [slug, aliases] of Object.entries(COMPANY_ORG_ALIASES)) {
    if (aliases.some((a) => n === a || n.startsWith(a))) return slug;
  }
  return null;
}

export interface WalletEntry {
  rsvp_id: string;
  full_name: string;
  organisation: string;
  job_title: string;
  primary_interest: string | null;
  contact_url: string | null;
  source: "meeting" | "manual";
  /** Counterpart's RSVP email — present only for booking-connected pairs. */
  meeting_email: string | null;
  saved_email: string | null;
  saved_phone: string | null;
}

async function meetingPartnerIds(ownerEmail: string, ownerOrg: string): Promise<Set<string>> {
  const ids = new Set<string>();
  const ownerSlug = slugForOrg(ownerOrg);

  // Attendee side: companies I booked → people from those startups.
  const { data: myBookings } = await supabaseAdmin
    .from("bookings")
    .select("company_id")
    .eq("email", ownerEmail);
  const bookedSlugs = new Set((myBookings ?? []).map((b) => String(b.company_id)));

  if (bookedSlugs.size || ownerSlug) {
    const { data: allRsvps } = await supabaseAdmin
      .from("rsvps")
      .select("id, email, organisation, show_in_lounge");

    if (bookedSlugs.size) {
      for (const r of allRsvps ?? []) {
        const s = slugForOrg(String(r.organisation));
        if (s && bookedSlugs.has(s) && String(r.email).toLowerCase() !== ownerEmail) ids.add(String(r.id));
      }
    }

    // Startup side: people who booked my company.
    if (ownerSlug) {
      const { data: theirBookings } = await supabaseAdmin
        .from("bookings")
        .select("email")
        .eq("company_id", ownerSlug);
      const partnerEmails = new Set((theirBookings ?? []).map((b) => String(b.email).toLowerCase()));
      for (const r of allRsvps ?? []) {
        if (partnerEmails.has(String(r.email).toLowerCase()) && String(r.email).toLowerCase() !== ownerEmail)
          ids.add(String(r.id));
      }
    }
  }
  return ids;
}

export const listMyContacts = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; entries: WalletEntry[] } | { ok: false }> => {
    const email = data.email?.toLowerCase().trim();
    if (!email) return { ok: false };
    const { data: owner } = await supabaseAdmin
      .from("rsvps")
      .select("id, organisation")
      .eq("email", email)
      .maybeSingle();
    if (!owner) return { ok: false };

    const partnerIds = await meetingPartnerIds(email, String(owner.organisation));

    const { data: saved } = await supabaseAdmin
      .from("lounge_contacts")
      .select("contact_rsvp_id, contact_email, contact_phone")
      .eq("owner_email", email);
    const savedMap = new Map(
      (saved ?? []).map((s) => [String(s.contact_rsvp_id), { e: s.contact_email, p: s.contact_phone }]),
    );

    const wantedIds = new Set([...partnerIds, ...savedMap.keys()]);
    if (!wantedIds.size) return { ok: true, entries: [] };

    const { data: rows, error } = await supabaseAdmin
      .from("rsvps")
      .select("id, full_name, organisation, job_title, primary_interest, contact_url, email")
      .in("id", [...wantedIds]);
    if (error) {
      console.error("listMyContacts error:", error);
      return { ok: false };
    }

    const entries: WalletEntry[] = (rows ?? [])
      .map((r) => {
        const isMeeting = partnerIds.has(String(r.id));
        const s = savedMap.get(String(r.id));
        return {
          rsvp_id: String(r.id),
          full_name: r.full_name,
          organisation: r.organisation,
          job_title: r.job_title,
          primary_interest: r.primary_interest,
          contact_url: r.contact_url,
          source: (isMeeting ? "meeting" : "manual") as WalletEntry["source"],
          meeting_email: isMeeting ? String(r.email) : null,
          saved_email: s?.e ?? null,
          saved_phone: s?.p ?? null,
        };
      })
      .sort((a, b) => (a.source === b.source ? a.full_name.localeCompare(b.full_name) : a.source === "meeting" ? -1 : 1));
    return { ok: true, entries };
  });

export const addLoungeContact = createServerFn({ method: "POST" })
  .validator((data: { ownerEmail: string; contactRsvpId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const email = data.ownerEmail?.toLowerCase().trim();
    if (!email || !data.contactRsvpId) return { ok: false };
    const { data: owner } = await supabaseAdmin.from("rsvps").select("id").eq("email", email).maybeSingle();
    if (!owner) return { ok: false };
    const { error } = await supabaseAdmin
      .from("lounge_contacts")
      .upsert(
        { owner_email: email, contact_rsvp_id: data.contactRsvpId, source: "manual" },
        { onConflict: "owner_email,contact_rsvp_id", ignoreDuplicates: true },
      );
    if (error) {
      console.error("addLoungeContact error:", error);
      return { ok: false };
    }
    return { ok: true };
  });

export const removeLoungeContact = createServerFn({ method: "POST" })
  .validator((data: { ownerEmail: string; contactRsvpId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const email = data.ownerEmail?.toLowerCase().trim();
    if (!email || !data.contactRsvpId) return { ok: false };
    const { error } = await supabaseAdmin
      .from("lounge_contacts")
      .delete()
      .eq("owner_email", email)
      .eq("contact_rsvp_id", data.contactRsvpId);
    if (error) {
      console.error("removeLoungeContact error:", error);
      return { ok: false };
    }
    return { ok: true };
  });

export const saveLoungeContactInfo = createServerFn({ method: "POST" })
  .validator((data: { ownerEmail: string; contactRsvpId: string; email?: string; phone?: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const email = data.ownerEmail?.toLowerCase().trim();
    if (!email || !data.contactRsvpId) return { ok: false };
    const { data: owner } = await supabaseAdmin
      .from("rsvps")
      .select("id, organisation")
      .eq("email", email)
      .maybeSingle();
    if (!owner) return { ok: false };
    const partnerIds = await meetingPartnerIds(email, String(owner.organisation));
    const source = partnerIds.has(data.contactRsvpId) ? "meeting" : "manual";
    const { error } = await supabaseAdmin.from("lounge_contacts").upsert(
      {
        owner_email: email,
        contact_rsvp_id: data.contactRsvpId,
        contact_email: data.email?.trim() || null,
        contact_phone: data.phone?.trim() || null,
        source,
      },
      { onConflict: "owner_email,contact_rsvp_id" },
    );
    if (error) {
      console.error("saveLoungeContactInfo error:", error);
      return { ok: false };
    }
    return { ok: true };
  });
