import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { companies } from "@/data/companies";
import { EVENT_DATE, TIMESLOTS } from "@/data/timeslots";
import { supabase } from "@/lib/supabase-client";
import { createBooking, lookupBookingsByEmail, selfCancelBooking, type BookingInput, type MyBooking } from "@/lib/booking.server";
import kimstLogo from "@/assets/kimst-logo.png";

const searchSchema = z.object({
  company: z.string().optional(),
});

export const Route = createFileRoute("/book")({
  component: BookPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Book a 1:1 Meeting — KIMST Singapore Startup Accelerator 2026" }],
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

function BookPage() {
  const { company: preselectSlug } = Route.useSearch();

  const [booked, setBooked] = useState<Set<BookedKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState<Record<string, string>>({}); // timeslotId -> companySlug

  const [selected, setSelected] = useState<{ companySlug: string; timeslotId: string } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successFor, setSuccessFor] = useState<{ companySlug: string; timeslotId: string } | null>(null);

  // "Check your booking" panel
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResults, setLookupResults] = useState<MyBooking[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selfCancelling, setSelfCancelling] = useState<string | null>(null);

  const refreshAvailability = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("booked_slots").select("company_id, timeslot_id");
    if (!error && data) {
      setBooked(new Set(data.map((row) => key(row.company_id, row.timeslot_id))));
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshAvailability();
    try {
      const stored = localStorage.getItem("kimst-my-bookings");
      if (stored) setMyBookings(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (preselectSlug && companies.some((c) => c.slug === preselectSlug)) {
      const openSlot = TIMESLOTS.find((t) => !booked.has(key(preselectSlug, t.id)) && !myBookings[t.id]);
      if (openSlot && !loading) {
        setSelected({ companySlug: preselectSlug, timeslotId: openSlot.id });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectSlug, loading]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.slug === selected?.companySlug),
    [selected],
  );

  function openBooking(companySlug: string, timeslotId: string) {
    setFormError(null);
    setSuccessFor(null);
    setSelected({ companySlug, timeslotId });
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
    const t = TIMESLOTS.find((x) => x.id === b.timeslot_id);
    if (
      !confirm(
        `Cancel your ${t?.label ?? ""} meeting with ${c?.name ?? b.company_id}?\n\nThis frees the slot for someone else and cannot be undone.`,
      )
    )
      return;
    setSelfCancelling(b.id);
    const res = await selfCancelBooking({ data: { email: lookupEmail, id: b.id } });
    setSelfCancelling(null);
    if (res.ok) {
      setLookupResults((prev) => (prev ? prev.filter((x) => x.id !== b.id) : prev));
      // Clear the localStorage badge for this slot if it matches
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setFormError(null);

    const payload: BookingInput = {
      companySlug: selected.companySlug,
      timeslotId: selected.timeslotId,
      fullName: form.fullName.trim(),
      organisation: form.organisation.trim(),
      jobTitle: form.jobTitle.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      primaryInterest: form.primaryInterest,
      notes: form.notes.trim() || undefined,
    };

    const result = await createBooking({ data: payload });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      await refreshAvailability();
      return;
    }

    const updated = { ...myBookings, [selected.timeslotId]: selected.companySlug };
    setMyBookings(updated);
    try {
      localStorage.setItem("kimst-my-bookings", JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSuccessFor(selected);
    setSelected(null);
    setLookupEmail(payload.email);
    setLookupResults(null);
    await refreshAvailability();
  }

  const myBookingCount = Object.keys(myBookings).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={kimstLogo} alt="KIMST" className="h-14 w-auto shrink-0 object-contain sm:h-16" />
          </Link>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 sm:px-4 sm:text-sm"
          >
            ← Home
          </Link>
        </div>
      </header>

      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            {EVENT_DATE} · IMDA Office, Level 5
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Book a 1:1 Meeting</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/85">
            Pick a startup and an open time slot below. Each slot fits one meeting — once it's
            booked, it disappears for everyone else. You can book up to two meetings total, one
            per session.
          </p>
          {myBookingCount > 0 && (
            <div className="mt-5 inline-flex flex-wrap gap-2 rounded-2xl bg-primary-foreground/10 px-4 py-3 text-sm">
              {Object.entries(myBookings).map(([timeslotId, companySlug]) => {
                const c = companies.find((x) => x.slug === companySlug);
                const t = TIMESLOTS.find((x) => x.id === timeslotId);
                if (!c || !t) return null;
                return (
                  <span key={timeslotId} className="rounded-full bg-primary-foreground/15 px-3 py-1">
                    ✓ {t.label} — {c.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
        {successFor && (
          <div className="mb-8 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-900">
            <div className="font-semibold">Meeting booked!</div>
            <p className="mt-1 text-sm">
              You're confirmed with{" "}
              <strong>{companies.find((c) => c.slug === successFor.companySlug)?.name}</strong> for{" "}
              {TIMESLOTS.find((t) => t.id === successFor.timeslotId)?.label} (
              {TIMESLOTS.find((t) => t.id === successFor.timeslotId)?.time}).
            </p>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-secondary text-left text-navy">
                <th className="p-4 font-semibold">Startup</th>
                {TIMESLOTS.map((t) => (
                  <th key={t.id} className="p-4 font-semibold">
                    {t.label}
                    <div className="text-xs font-normal text-muted-foreground">{t.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.slug} className="border-t border-border">
                  <td className="p-4">
                    <div className="font-semibold text-navy">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.sector}</div>
                  </td>
                  {TIMESLOTS.map((t) => {
                    const isBooked = booked.has(key(c.slug, t.id));
                    const isMine = myBookings[t.id] === c.slug;
                    const iHaveThisSession = Boolean(myBookings[t.id]) && !isMine;
                    const disabled = loading || isBooked || iHaveThisSession;
                    return (
                      <td key={t.id} className="p-4">
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
                            onClick={() => openBooking(c.slug, t.id)}
                            title={iHaveThisSession ? "You've already booked this session" : undefined}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Book
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

        {/* CHECK / MANAGE YOUR BOOKING */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Already booked?
          </div>
          <h2 className="mt-2 text-xl font-bold text-navy">Check or cancel your booking</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email you used when booking to see your confirmed meetings on any device.
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
                  No bookings found for this email. If you just booked, double-check the spelling —
                  the lookup matches the exact email used on the form.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {lookupResults.map((b) => {
                    const c = companies.find((x) => x.slug === b.company_id);
                    const t = TIMESLOTS.find((x) => x.id === b.timeslot_id);
                    return (
                      <div key={b.id} className="rounded-xl border border-border bg-background p-5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {t?.label} · {t?.time}
                        </div>
                        <div className="mt-1.5 text-lg font-bold text-navy">{c?.name ?? b.company_id}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {EVENT_DATE} · IMDA Office, Level 5
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

        {selected && selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-6 shadow-elegant sm:rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {TIMESLOTS.find((t) => t.id === selected.timeslotId)?.label} ·{" "}
                    {TIMESLOTS.find((t) => t.id === selected.timeslotId)?.time}
                  </div>
                  <h3 className="mt-1 text-xl font-bold text-navy">{selectedCompany.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
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
                <div>
                  <label className="text-xs font-semibold text-navy">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm"
                  />
                </div>

                {formError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? "Booking…" : "Confirm My Meeting →"}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
