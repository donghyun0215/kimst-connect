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

    const { error } = await supabaseAdmin.from("bookings").insert({
      company_id: companySlug,
      timeslot_id: timeslotId,
      full_name: fullName,
      organisation,
      job_title: jobTitle,
      email: email.toLowerCase().trim(),
      phone,
      primary_interest: primaryInterest,
      notes: notes ?? null,
    });

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
      .select("id");
    if (error) {
      console.error("selfCancelBooking error:", error);
      return { ok: false };
    }
    return { ok: (deleted?.length ?? 0) > 0 };
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
    const { error } = await supabaseAdmin.from("bookings").delete().eq("id", data.id);
    if (error) {
      console.error("adminCancelBooking error:", error);
      return { ok: false };
    }
    return { ok: true };
  });
