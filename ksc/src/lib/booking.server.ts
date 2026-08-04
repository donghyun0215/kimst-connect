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
      for (const sel of data.meetupSelections.slice(0, 2)) {
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
  attend_showcase: boolean;
  attend_lunch: boolean;
  attend_meetups: boolean;
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
