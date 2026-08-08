import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { companies, TRACKS } from "@/data/companies";
import { NULDAM_TRACKS, NULDAM_VENUE, NULDAM_ADDRESS, NULDAM_COMPANY_SLUGS, NULDAM_MAP_URL } from "@/data/timeslots";
import { supabase } from "@/lib/supabase-client";
import { createBooking, type BookingInput } from "@/lib/booking.server";
import kimstLogo from "@/assets/kimst-logo.png";

const searchSchema = z.object({
  company: z.string().optional(),
});

export const Route = createFileRoute("/meet")({
  component: MeetPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Book a 1:1 Meeting — KIMST Singapore Startup Accelerator 2026" },
      {
        name: "description",
        content: "Reserve a private 30-minute meeting with Korea's marine-tech startups at Nuldam Space, Orchard.",
      },
    ],
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

function MeetPage() {
  const { company: preselectSlug } = Route.useSearch();

  const [booked, setBooked] = useState<Set<BookedKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [mySlots, setMySlots] = useState<Set<string>>(new Set()); // timeslot ids I already hold

  const [expanded, setExpanded] = useState<string | null>(null); // company slug whose slots are open
  const [selected, setSelected] = useState<{ companySlug: string; timeslotId: string } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successFor, setSuccessFor] = useState<{ companySlug: string; timeslotId: string } | null>(null);

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
      const stored = localStorage.getItem("kimst-my-email");
      if (stored) setMyEmail(stored);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("meet-availability")
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

  const trackCompanies = useMemo(
    () => ({
      track1: companies.filter((c) => NULDAM_COMPANY_SLUGS.track1.includes(c.slug)),
      track2: companies.filter((c) => NULDAM_COMPANY_SLUGS.track2.includes(c.slug)),
    }),
    [],
  );

  const preselectCompany = companies.find((c) => c.slug === preselectSlug);

  useEffect(() => {
    if (preselectSlug) setExpanded(preselectSlug);
  }, [preselectSlug]);

  function openBooking(companySlug: string, timeslotId: string) {
    setFormError(null);
    setSuccessFor(null);
    setSelected({ companySlug, timeslotId });
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

    try {
      localStorage.setItem("kimst-my-email", payload.email.toLowerCase());
    } catch {
      // ignore
    }
    setMyEmail(payload.email.toLowerCase());
    setMySlots((prev) => new Set(prev).add(selected.timeslotId));
    setSuccessFor(selected);
    setSelected(null);
    await refreshAvailability();
  }

  const selectedCompany = companies.find((c) => c.slug === selected?.companySlug);
  const selectedTrack = NULDAM_TRACKS.find((t) => t.slots.some((s) => s.id === selected?.timeslotId));
  const selectedSlot = selectedTrack?.slots.find((s) => s.id === selected?.timeslotId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={kimstLogo} alt="KIMST" className="h-10 w-auto shrink-0 object-contain sm:h-12 md:h-14" />
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              to="/book"
              className="rounded-full bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-secondary-foreground transition hover:bg-accent sm:px-4 sm:py-2 sm:text-sm"
            >
              Event RSVP<span className="hidden sm:inline"> (2 Sep)</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 sm:px-4 sm:text-sm"
            >
              ← Home
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Private 1:1 Meetings · By Track
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Book a 1:1 Meeting</h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
            Reserve a private 30-minute session with the startups of your choice at{" "}
            <span className="font-semibold text-primary-foreground">{NULDAM_VENUE}</span>, {NULDAM_ADDRESS}.{" "}
            <a
              href={NULDAM_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary-foreground underline underline-offset-2 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
              View on Google Maps
            </a>
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {NULDAM_TRACKS.map((t) => (
              <div key={t.id} className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 backdrop-blur-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-primary-foreground/75">
                  {TRACKS[t.id].title}
                </div>
                <div className="mt-0.5 text-sm font-bold">
                  {t.dateLabel} · {t.timeRange}
                </div>
              </div>
            ))}
          </div>
          {preselectCompany && (
            <div className="mt-4 inline-flex rounded-full bg-primary-foreground/15 px-4 py-2 text-sm">
              Booking for <span className="mx-1.5 font-bold">{preselectCompany.name}</span> — jump to{" "}
              {preselectCompany.track === "track1" ? "Track 1 (31 Aug)" : "Track 2 (4 Sep)"} below.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        {successFor && (
          <div className="mb-8 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-900">
            <div className="font-semibold">Meeting booked!</div>
            <p className="mt-1 text-sm">
              You're confirmed with{" "}
              <strong>{companies.find((c) => c.slug === successFor.companySlug)?.name}</strong>{" "}
              at{" "}
              {
                NULDAM_TRACKS.flatMap((t) => t.slots).find((s) => s.id === successFor.timeslotId)?.time
              }{" "}
              on{" "}
              {
                NULDAM_TRACKS.find((t) => t.slots.some((s) => s.id === successFor.timeslotId))?.dateLabel
              }
              , {NULDAM_VENUE}. You can review or cancel it anytime on the{" "}
              <Link to="/book" className="font-semibold underline">
                RSVP page
              </Link>{" "}
              under "Check or cancel".
            </p>
          </div>
        )}

        {NULDAM_TRACKS.map((track) => {
          const list = trackCompanies[track.id];
          return (
            <div key={track.id} className="mb-12">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="text-xl font-bold text-navy md:text-2xl">{TRACKS[track.id].title}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {track.dateLabel} · {track.timeRange} · {NULDAM_VENUE}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((c) => (
                    <Link
                      key={c.slug}
                      to="/companies/$slug"
                      params={{ slug: c.slug }}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:bg-accent"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              {track.id === "track2" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Wise Bio (YS Bio) and Con Trâu Eco meet partners 1:1 at the Open Innovation Day
                  on 2 September —{" "}
                  <Link to="/book" className="font-semibold text-primary hover:underline">
                    RSVP here
                  </Link>
                  .
                </p>
              )}

              <div className="mt-4 space-y-3">
                {list.map((c) => {
                  const isOpen = expanded === c.slug;
                  const openCount = track.slots.filter((slot) => !booked.has(key(c.slug, slot.id))).length;
                  return (
                    <div
                      key={c.slug}
                      className={`overflow-hidden rounded-2xl border shadow-sm transition ${
                        isOpen ? "border-primary/40 bg-card" : "border-border bg-card"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : c.slug)}
                        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block text-base font-bold text-navy">{c.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{c.sector}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span
                            className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
                              openCount > 0 ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {openCount > 0 ? `${openCount} slot${openCount > 1 ? "s" : ""} open` : "Fully booked"}
                          </span>
                          <svg
                            className={`h-4 w-4 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-border px-5 py-4">
                          <div className="text-xs font-semibold text-muted-foreground">
                            {track.dateLabel} ·{" "}
                            <a
                              href={NULDAM_MAP_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2 transition hover:text-primary"
                            >
                              {NULDAM_VENUE}
                            </a>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2.5">
                            {track.slots.map((slot) => {
                              const isBooked = booked.has(key(c.slug, slot.id));
                              const iHoldThisTime = mySlots.has(slot.id);
                              if (isBooked) {
                                return (
                                  <span
                                    key={slot.id}
                                    className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground line-through"
                                  >
                                    {slot.time}
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  disabled={loading || iHoldThisTime}
                                  onClick={() => openBooking(c.slug, slot.id)}
                                  title={iHoldThisTime ? "You already booked this time" : undefined}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-background px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Each slot is a private 30-minute meeting — once booked, it closes for everyone else. You
          can meet several startups, one meeting per time slot. Already booked? Manage your
          meetings on the{" "}
          <Link to="/book" className="font-semibold text-primary hover:underline">
            RSVP page
          </Link>
          .
        </p>
      </section>

      {/* BOOKING MODAL */}
      {selected && selectedCompany && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-6 shadow-elegant sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {selectedTrack?.dateLabel} · {selectedSlot.time}
                </div>
                <h3 className="mt-1 text-xl font-bold text-navy">{selectedCompany.name}</h3>
                <a
                  href={NULDAM_MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground underline underline-offset-2 transition hover:text-primary"
                >
                  {NULDAM_VENUE} · Map
                </a>
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
                  placeholder="What you'd like to discuss..."
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
    </div>
  );
}
