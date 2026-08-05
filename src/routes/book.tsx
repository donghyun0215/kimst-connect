import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { companies } from "@/data/companies";
import {
  EVENT_DATE,
  EVENT_TIME,
  EVENT_VENUE,
  EVENT_ADDRESS,
  PROGRAM,
  TIMESLOTS,
  getSlotInfo,
} from "@/data/timeslots";
import { supabase } from "@/lib/supabase-client";
import {
  createRsvp,
  lookupBookingsByEmail,
  selfCancelBooking,
  type RsvpInput,
  type MyBooking,
} from "@/lib/booking.server";
import kimstLogo from "@/assets/kimst-logo.png";

const searchSchema = z.object({
  company: z.string().optional(),
});

export const Route = createFileRoute("/book")({
  component: RsvpPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "RSVP — KIMST Singapore Startup Accelerator 2026" }],
  }),
});

type BookedKey = `${string}__${string}`;
const key = (companySlug: string, timeslotId: string): BookedKey => `${companySlug}__${timeslotId}`;

const INTEREST_OPTIONS = [
  "Pilot / trial opportunity",
  "Investment",
  "Distribution / partnership",
  "General interest",
];

interface FormState {
  fullName: string;
  organisation: string;
  jobTitle: string;
  email: string;
  phone: string;
  primaryInterest: string;
  notes: string;
}

const emptyForm: FormState = {
  fullName: "",
  organisation: "",
  jobTitle: "",
  email: "",
  phone: "",
  primaryInterest: "",
  notes: "",
};

function RsvpPage() {
  const { company: preselectSlug } = Route.useSearch();

  // availability
  const [booked, setBooked] = useState<Set<BookedKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState<Record<string, string>>({}); // timeslotId -> companySlug

  // rsvp form
  const [attend, setAttend] = useState({ showcase: false, lunch: false, meetups: false });
  const [selections, setSelections] = useState<Record<string, string | null>>({
    slot1: null,
    slot2: null,
  });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{
    attend: typeof attend;
    bookings: { timeslotId: string; companySlug: string; ok: boolean; message?: string }[];
  } | null>(null);

  // lookup / self-manage
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResults, setLookupResults] = useState<MyBooking[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selfCancelling, setSelfCancelling] = useState<string | null>(null);

  const refreshAvailability = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("booked_slots").select("company_id, timeslot_id");
    if (!error && data) {
      const serverBooked = new Set(data.map((row) => key(row.company_id, row.timeslot_id)));
      setBooked(serverBooked);
      setMyBookings((prev) => {
        const next: Record<string, string> = {};
        let changed = false;
        for (const [timeslotId, companySlug] of Object.entries(prev)) {
          if (serverBooked.has(key(companySlug, timeslotId))) next[timeslotId] = companySlug;
          else changed = true;
        }
        if (changed) {
          try {
            localStorage.setItem("kimst-my-bookings", JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return changed ? next : prev;
      });
    }
    setLoading(false);
  };

  const syncMyBookingsFromServer = async (email: string) => {
    const rows = await lookupBookingsByEmail({ data: { email } });
    const next: Record<string, string> = {};
    for (const b of rows) next[b.timeslot_id] = b.company_id;
    setMyBookings(next);
    try {
      localStorage.setItem("kimst-my-bookings", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshAvailability();
    try {
      const storedEmail = localStorage.getItem("kimst-my-email");
      if (storedEmail) {
        setLookupEmail(storedEmail);
        syncMyBookingsFromServer(storedEmail);
      } else {
        const stored = localStorage.getItem("kimst-my-bookings");
        if (stored) setMyBookings(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live availability
  useEffect(() => {
    const channel = supabase
      .channel("book-availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        refreshAvailability();
      })
      .subscribe();
    const poll = setInterval(refreshAvailability, 30000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preselect from ?company=
  useEffect(() => {
    if (!loading && preselectSlug && companies.some((c) => c.slug === preselectSlug)) {
      setAttend((a) => ({ ...a, meetups: true }));
      setSelections((prev) => {
        const openSlot = TIMESLOTS.find(
          (t) => !booked.has(key(preselectSlug, t.id)) && !myBookings[t.id] && !prev[t.id],
        );
        if (!openSlot) return prev;
        return { ...prev, [openSlot.id]: preselectSlug };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectSlug, loading]);

  function toggleSelection(timeslotId: string, companySlug: string) {
    setSelections((prev) => ({
      ...prev,
      [timeslotId]: prev[timeslotId] === companySlug ? null : companySlug,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!attend.showcase && !attend.lunch && !attend.meetups) {
      setFormError("Please select at least one session to attend.");
      return;
    }
    const meetupSelections = attend.meetups
      ? TIMESLOTS.filter((t) => selections[t.id] && !myBookings[t.id]).map((t) => ({
          timeslotId: t.id,
          companySlug: selections[t.id] as string,
        }))
      : [];
    if (attend.meetups && meetupSelections.length === 0 && Object.keys(myBookings).length === 0) {
      setFormError("Please pick at least one startup for your 1:1 meetups (or untick that session).");
      return;
    }

    setSubmitting(true);
    const payload: RsvpInput = {
      fullName: form.fullName.trim(),
      organisation: form.organisation.trim(),
      jobTitle: form.jobTitle.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      primaryInterest: form.primaryInterest,
      notes: form.notes.trim() || undefined,
      attendShowcase: attend.showcase,
      attendLunch: attend.lunch,
      attendMeetups: attend.meetups,
      meetupSelections,
    };
    const result = await createRsvp({ data: payload });
    setSubmitting(false);

    if (!result.rsvpOk) {
      setFormError(result.message ?? "Something went wrong. Please try again.");
      return;
    }

    try {
      localStorage.setItem("kimst-my-email", payload.email.toLowerCase());
    } catch {
      // ignore
    }
    setLookupEmail(payload.email);
    setLookupResults(null);
    setSubmitted({ attend: { ...attend }, bookings: result.bookingResults });
    setSelections({ slot1: null, slot2: null });
    await refreshAvailability();
    await syncMyBookingsFromServer(payload.email);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const email = lookupEmail.trim();
    if (!email) return;
    setLookupLoading(true);
    const rows = await lookupBookingsByEmail({ data: { email } });
    setLookupLoading(false);
    setLookupResults(rows);
  }

  async function handleSelfCancel(b: MyBooking) {
    const c = companies.find((x) => x.slug === b.company_id);
    const info = getSlotInfo(b.timeslot_id);
    if (
      !confirm(
        `Cancel your ${info.label} (${info.time}) meeting with ${c?.name ?? b.company_id}?\n\nThis frees the slot for someone else and cannot be undone.`,
      )
    )
      return;
    setSelfCancelling(b.id);
    const res = await selfCancelBooking({ data: { email: lookupEmail, id: b.id } });
    setSelfCancelling(null);
    if (res.ok) {
      setLookupResults((prev) => (prev ? prev.filter((x) => x.id !== b.id) : prev));
      const updated = { ...myBookings };
      if (updated[b.timeslot_id] === b.company_id) {
        delete updated[b.timeslot_id];
        setMyBookings(updated);
        try {
          localStorage.setItem("kimst-my-bookings", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      await refreshAvailability();
    } else {
      alert("Could not cancel this booking. Please refresh and try again.");
    }
  }

  const myBookingCount = Object.keys(myBookings).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={kimstLogo} alt="KIMST" className="h-10 w-auto shrink-0 object-contain sm:h-12 md:h-14" />
          </Link>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 sm:px-4 sm:text-sm"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-12">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            RSVP · {EVENT_DATE} · {EVENT_TIME}
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Reserve Your Seat</h1>
          <p className="mt-2 text-sm text-primary-foreground/85 sm:text-base">
            {EVENT_VENUE} · {EVENT_ADDRESS}
          </p>

          {/* Program overview */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PROGRAM.map((p) => (
              <div key={p.id} className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 backdrop-blur-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-primary-foreground/75">{p.time}</div>
                <div className="mt-0.5 text-sm font-bold">{p.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-primary-foreground/80">{p.description}</div>
              </div>
            ))}
          </div>

          {myBookingCount > 0 && (
            <div className="mt-5 inline-flex flex-wrap gap-2 rounded-2xl bg-primary-foreground/10 px-4 py-3 text-sm">
              {Object.entries(myBookings).map(([timeslotId, companySlug]) => {
                const c = companies.find((x) => x.slug === companySlug);
                const t = TIMESLOTS.find((x) => x.id === timeslotId);
                if (!c || !t) return null;
                return (
                  <span key={timeslotId} className="rounded-full bg-primary-foreground/15 px-3 py-1">
                    ✓ 1:1 {t.label} — {c.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
        {/* SUCCESS SUMMARY */}
        {submitted && (
          <div className="mb-8 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-900">
            <div className="font-semibold">RSVP confirmed — see you on 2 September!</div>
            <ul className="mt-2 space-y-1 text-sm">
              {submitted.attend.showcase && <li>✓ Success Story Showcase (10:30 – 12:30)</li>}
              {submitted.attend.lunch && <li>✓ Networking Lunch (12:30 – 14:00)</li>}
              {submitted.bookings.map((b) => {
                const c = companies.find((x) => x.slug === b.companySlug);
                const t = TIMESLOTS.find((x) => x.id === b.timeslotId);
                return (
                  <li key={`${b.timeslotId}-${b.companySlug}`} className={b.ok ? "" : "text-red-700"}>
                    {b.ok ? "✓" : "✕"} 1:1 {t?.label} — {c?.name}
                    {!b.ok && b.message ? ` (${b.message} Pick another startup below and re-submit.)` : ""}
                  </li>
                );
              })}
              {submitted.attend.meetups && submitted.bookings.length === 0 && (
                <li>✓ 1:1 Onsite Meetups</li>
              )}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1 — sessions */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                Step 01
              </span>
              <h2 className="text-lg font-bold text-navy">Sessions You'll Attend</h2>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">Select all that apply.</p>

            <div className="mt-5 space-y-3">
              {PROGRAM.map((p) => {
                const checked = attend[p.id];
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition ${
                      checked ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setAttend((a) => ({ ...a, [p.id]: e.target.checked }))}
                      className="mt-1 h-4 w-4 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="block text-sm font-bold text-navy">
                        {p.title} <span className="ml-1 font-medium text-muted-foreground">{p.time}</span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{p.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {/* 1:1 picker — appears when meetups checked */}
            {attend.meetups && (
              <div className="mt-5 rounded-xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-5">
                <div className="text-sm font-bold text-navy">Pick your startups</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  One startup per round, up to two meetings. Greyed-out slots are already taken.
                </p>
                <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-secondary text-left text-navy">
                        <th className="p-3 font-semibold">Startup</th>
                        {TIMESLOTS.map((t) => (
                          <th key={t.id} className="p-3 font-semibold">
                            {t.label}
                            <div className="text-xs font-normal text-muted-foreground">{t.time}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c) => (
                        <tr key={c.slug} className="border-t border-border">
                          <td className="p-3">
                            <div className="font-semibold text-navy">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.sector}</div>
                          </td>
                          {TIMESLOTS.map((t) => {
                            const isBooked = booked.has(key(c.slug, t.id));
                            const isMine = myBookings[t.id] === c.slug;
                            const iHaveThisRound = Boolean(myBookings[t.id]) && !isMine;
                            const isSelected = selections[t.id] === c.slug;
                            const disabled = loading || isBooked || isMine || iHaveThisRound;
                            return (
                              <td key={t.id} className="p-3">
                                {isMine ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">
                                    ✓ Booked
                                  </span>
                                ) : isBooked ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                    Full
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => toggleSelection(t.id, c.slug)}
                                    title={iHaveThisRound ? "You already have a meeting in this round" : undefined}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                      isSelected
                                        ? "bg-navy text-white"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    }`}
                                  >
                                    {isSelected ? "✓ Selected" : "Select"}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2 — details */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                Step 02
              </span>
              <h2 className="text-lg font-bold text-navy">Your Details</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-navy">Full Name *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy">Organisation *</label>
                <input
                  required
                  value={form.organisation}
                  onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy">Job Title *</label>
                <input
                  required
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Re-submitting with the same email updates your RSVP.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy">Phone *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+65 XXXX XXXX"
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy">Primary Interest *</label>
                <select
                  required
                  value={form.primaryInterest}
                  onChange={(e) => setForm({ ...form, primaryInterest: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select one...
                  </option>
                  {INTEREST_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-navy">
                Any notes or questions? <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Dietary requirements, questions, or anything else you'd like us to know..."
                className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm"
              />
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Confirm My RSVP →"}
            </button>
          </div>
        </form>

        {/* CHECK / MANAGE */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Already registered?
          </div>
          <h2 className="mt-2 text-xl font-bold text-navy">Check or cancel your 1:1 meetings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email you used to see your confirmed meetings on any device. To change your
            session choices, just re-submit the form above with the same email.
          </p>
          <form onSubmit={handleLookup} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={lookupEmail}
              onChange={(e) => {
                setLookupEmail(e.target.value);
                setLookupResults(null);
              }}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-input px-3 py-2.5 text-sm sm:max-w-sm"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
            >
              {lookupLoading ? "Checking…" : "Find my bookings"}
            </button>
          </form>

          {lookupResults !== null && (
            <div className="mt-6">
              {lookupResults.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No 1:1 meetings found for this email. If you just registered, double-check the
                  spelling — the lookup matches the exact email used on the form.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {lookupResults.map((b) => {
                    const c = companies.find((x) => x.slug === b.company_id);
                    const t = TIMESLOTS.find((x) => x.id === b.timeslot_id);
                    return (
                      <div key={b.id} className="rounded-xl border border-border bg-background p-5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {getSlotInfo(b.timeslot_id).label} · {getSlotInfo(b.timeslot_id).time}
                        </div>
                        <div className="mt-1.5 text-lg font-bold text-navy">{c?.name ?? b.company_id}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {getSlotInfo(b.timeslot_id).context}
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          {c && (
                            <Link
                              to="/companies/$slug"
                              params={{ slug: c.slug }}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              View one-pager →
                            </Link>
                          )}
                          <button
                            onClick={() => handleSelfCancel(b)}
                            disabled={selfCancelling === b.id}
                            className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {selfCancelling === b.id ? "Cancelling…" : "Cancel booking"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          By submitting, you agree that the organizers may use your details to manage event
          logistics and communications. Personal data will be used solely for this event and
          handled in accordance with the Personal Data Protection Act (PDPA).
        </p>
      </section>
    </div>
  );
}
