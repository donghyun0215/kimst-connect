import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { companies } from "@/data/companies";
import { EVENT_DATE, TIMESLOTS, NULDAM_TRACKS, NULDAM_VENUE, NULDAM_COMPANY_SLUGS, getSlotInfo, isSlotOffered } from "@/data/timeslots";
import { supabase } from "@/lib/supabase-client";
import { adminListBookings, adminCancelBooking, adminListEvents, adminListRsvps, type AdminBooking, type BookingEvent, type AdminRsvp } from "@/lib/booking.server";
import kimstLogo from "@/assets/kimst-logo.png";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — KIMST Singapore Connect" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const SESSION_KEY = "kimst-admin-pw";

function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [rsvps, setRsvps] = useState<AdminRsvp[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const pwRef = useRef("");

  const load = useCallback(async (pw: string) => {
    setLoading(true);
    const [res, evRes, rsvpRes] = await Promise.all([
      adminListBookings({ data: { password: pw } }),
      adminListEvents({ data: { password: pw } }),
      adminListRsvps({ data: { password: pw } }),
    ]);
    setLoading(false);
    if (!res.ok) {
      setAuthError("Incorrect password.");
      setAuthed(false);
      return false;
    }
    setBookings(res.bookings);
    if (evRes.ok) setEvents(evRes.events);
    if (rsvpRes.ok) setRsvps(rsvpRes.rsvps);
    setLastSync(new Date());
    return true;
  }, []);

  // Restore session from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      pwRef.current = saved;
      load(saved).then((ok) => {
        if (ok) setAuthed(true);
        else sessionStorage.removeItem(SESSION_KEY);
      });
    }
  }, [load]);

  // Realtime: any change to bookings triggers a reload
  useEffect(() => {
    if (!authed) return;
    const channel = supabase
      .channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        load(pwRef.current);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_events" }, () => {
        load(pwRef.current);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, () => {
        load(pwRef.current);
      })
      .subscribe();

    // Fallback poll every 20s in case realtime isn't enabled on the table
    const poll = setInterval(() => load(pwRef.current), 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [authed, load]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const ok = await load(password);
    if (ok) {
      pwRef.current = password;
      sessionStorage.setItem(SESSION_KEY, password);
      setAuthed(true);
      setPassword("");
    }
  }

  async function handleCancel(b: AdminBooking) {
    const c = companies.find((x) => x.slug === b.company_id);
    const t = TIMESLOTS.find((x) => x.id === b.timeslot_id);
    if (
      !confirm(
        `Cancel ${b.full_name}'s booking with ${c?.name ?? b.company_id} (${t?.label ?? b.timeslot_id})?\n\nThe slot will reopen for others.`,
      )
    )
      return;
    setCancelling(b.id);
    const res = await adminCancelBooking({ data: { password: pwRef.current, id: b.id } });
    setCancelling(null);
    if (res.ok) {
      setBookings((prev) => prev.filter((x) => x.id !== b.id));
    } else {
      alert("Could not cancel. Please refresh and try again.");
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    pwRef.current = "";
    setAuthed(false);
    setBookings([]);
  }

  const byKey = useMemo(() => {
    const map = new Map<string, AdminBooking>();
    for (const b of bookings) map.set(`${b.company_id}__${b.timeslot_id}`, b);
    return map;
  }, [bookings]);

  const guestCount = (v: string | null) =>
    v ? v.split(",").map((x) => x.trim()).filter(Boolean).length : 0;
  const totalGuests = rsvps.reduce((n, r) => n + guestCount(r.additional_attendees), 0);
  const totalSlots = companies.reduce(
    (n, c) => n + TIMESLOTS.filter((t) => isSlotOffered(c.slug, t.id)).length,
    0,
  );

  // ── LOGIN GATE ──────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-elegant">
          <img src={kimstLogo} alt="KIMST" className="h-8 w-auto object-contain" />
          <h1 className="mt-6 text-xl font-bold text-navy">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the admin password to manage 1:1 meeting bookings.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-input px-3 py-2.5 text-sm"
            />
            {authError && <div className="text-sm text-red-600">{authError}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Checking…" : "Enter"}
            </button>
          </form>
          <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:underline">
            ← Back to site
          </Link>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={kimstLogo} alt="KIMST" className="h-9 w-auto object-contain" />
            <div>
              <div className="text-sm font-bold text-navy">Admin Dashboard</div>
              <div className="text-xs text-muted-foreground">1:1 Meetings · {EVENT_DATE}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Live
              {lastSync && ` · synced ${lastSync.toLocaleTimeString()}`}
            </span>
            <button onClick={() => load(pwRef.current)} className="rounded-full border border-border px-3 py-1.5 font-semibold text-navy hover:bg-muted">
              Refresh
            </button>
            <button onClick={logout} className="rounded-full border border-border px-3 py-1.5 font-semibold text-navy hover:bg-muted">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total RSVPs" value={`${rsvps.length}${totalGuests ? ` (+${totalGuests} guests)` : ""}`} />
          <Stat label="Showcase" value={`${rsvps.filter((r) => r.attend_showcase).length}`} />
          <Stat label="Lunch (catering)" value={`${rsvps.filter((r) => r.attend_lunch).length}`} />
          <Stat label="1:1 attendees" value={`${rsvps.filter((r) => r.attend_meetups).length}`} />
          <Stat label="Event 1:1 filled" value={`${bookings.filter((b) => b.timeslot_id.startsWith("slot")).length} / ${totalSlots}`} />
          <Stat label="Nuldam 1:1 booked" value={`${bookings.filter((b) => b.timeslot_id.startsWith("n")).length}`} />
        </div>

        {/* RSVP TABLE */}
        <h2 className="mt-10 text-lg font-bold text-navy">RSVPs ({rsvps.length})</h2>
        <p className="text-sm text-muted-foreground">Everyone who registered, with the sessions they'll attend.</p>
        {rsvps.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No RSVPs yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border shadow-sm">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-secondary text-left text-navy">
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Organisation</th>
                  <th className="p-3 font-semibold">Contact</th>
                  <th className="p-3 font-semibold">Sessions</th>
                  <th className="p-3 font-semibold">1:1 meetings</th>
                  <th className="p-3 font-semibold">Interest</th>
                  <th className="p-3 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => {
                  const myMeetings = bookings.filter((b) => b.email === r.email);
                  return (
                    <tr key={r.id} className="border-t border-border align-top">
                      <td className="p-3 font-semibold text-navy">
                        {r.full_name}
                        <div className="text-xs font-normal text-muted-foreground">{r.job_title}</div>
                        {r.additional_attendees && (
                          <div className="mt-1 text-xs font-normal text-primary">
                            +{guestCount(r.additional_attendees)}: {r.additional_attendees}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{r.organisation}</td>
                      <td className="p-3">
                        <a href={`mailto:${r.email}`} className="text-primary hover:underline">{r.email}</a>
                        <div className="text-xs text-muted-foreground">{r.phone}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {r.attend_showcase && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Showcase</span>
                          )}
                          {r.attend_lunch && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">Lunch</span>
                          )}
                          {r.attend_meetups && (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800">1:1</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        {myMeetings.length === 0
                          ? <span className="text-muted-foreground">—</span>
                          : myMeetings.map((b) => {
                              const c = companies.find((x) => x.slug === b.company_id);
                              const t = TIMESLOTS.find((x) => x.id === b.timeslot_id);
                              return <div key={b.id}>{getSlotInfo(b.timeslot_id).label} {getSlotInfo(b.timeslot_id).time}: {c?.name ?? b.company_id}</div>;
                            })}
                      </td>
                      <td className="p-3 text-xs">{r.primary_interest ?? "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* GRID VIEW */}
        <h2 className="mt-10 text-lg font-bold text-navy">Open Innovation Day — 1:1 Rounds (2 Sep)</h2>
        <p className="text-sm text-muted-foreground">Click a filled slot to cancel it and reopen it for others.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-secondary text-left text-navy">
                <th className="p-3 font-semibold">Startup</th>
                {TIMESLOTS.map((t) => (
                  <th key={t.id} className="p-3 font-semibold">
                    {t.label} <span className="font-normal text-muted-foreground">{t.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.slug} className="border-t border-border">
                  <td className="p-3 font-semibold text-navy">{c.name}</td>
                  {TIMESLOTS.map((t) => {
                    if (!isSlotOffered(c.slug, t.id)) {
                      return (
                        <td key={t.id} className="p-3">
                          <span className="inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground/40">
                            —
                          </span>
                        </td>
                      );
                    }
                    const b = byKey.get(`${c.slug}__${t.id}`);
                    return (
                      <td key={t.id} className="p-3">
                        {b ? (
                          <button
                            onClick={() => handleCancel(b)}
                            disabled={cancelling === b.id}
                            title="Click to cancel this booking"
                            className="group inline-flex flex-col items-start rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-left transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                          >
                            <span className="text-xs font-semibold text-navy group-hover:text-red-700">
                              {b.full_name}
                            </span>
                            <span className="text-[11px] text-muted-foreground group-hover:text-red-600">
                              {b.organisation}
                            </span>
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary group-hover:text-red-600">
                              {cancelling === b.id ? "Cancelling…" : "Cancel ✕"}
                            </span>
                          </button>
                        ) : (
                          <span className="inline-flex rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                            Open
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FULL TABLE */}
        {/* NULDAM 1:1 GRIDS */}
        <h2 className="mt-12 text-lg font-bold text-navy">Nuldam 1:1 Meetings ({NULDAM_VENUE})</h2>
        <p className="text-sm text-muted-foreground">Click a filled slot to cancel it and reopen it for others.</p>
        {NULDAM_TRACKS.map((track) => {
          const list = companies.filter((c) => NULDAM_COMPANY_SLUGS[track.id].includes(c.slug));
          return (
            <div key={track.id} className="mt-5">
              <div className="text-sm font-bold text-navy">
                {track.id === "track1" ? "Track 1" : "Track 2"} · {track.dateLabel} · {track.timeRange}
              </div>
              <div className="mt-2 overflow-x-auto rounded-2xl border border-border shadow-sm">
                <table className="w-full min-w-[620px] table-fixed border-collapse text-sm">
                  <thead>
                    <tr className="bg-secondary text-left text-navy">
                      <th className="w-28 p-3 font-semibold">Time</th>
                      {list.map((c) => (
                        <th key={c.slug} className="p-3 font-semibold">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {track.slots.map((slot) => (
                      <tr key={slot.id} className="border-t border-border">
                        <td className="p-3 text-xs font-semibold text-navy">{slot.time}</td>
                        {list.map((c) => {
                          const b = byKey.get(`${c.slug}__${slot.id}`);
                          return (
                            <td key={c.slug} className="p-2">
                              {b ? (
                                <button
                                  onClick={() => handleCancel(b)}
                                  disabled={cancelling === b.id}
                                  title="Click to cancel this booking"
                                  className="group inline-flex flex-col items-start rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-left transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <span className="text-xs font-semibold text-navy group-hover:text-red-700">{b.full_name}</span>
                                  <span className="text-[10px] text-muted-foreground group-hover:text-red-600">{b.organisation}</span>
                                </button>
                              ) : (
                                <span className="inline-flex rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
                                  Open
                                </span>
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
          );
        })}

        <h2 className="mt-12 text-lg font-bold text-navy">All Bookings ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No bookings yet. New bookings appear here in real time.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border shadow-sm">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="bg-secondary text-left text-navy">
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Organisation</th>
                  <th className="p-3 font-semibold">Startup</th>
                  <th className="p-3 font-semibold">Session</th>
                  <th className="p-3 font-semibold">Contact</th>
                  <th className="p-3 font-semibold">Interest</th>
                  <th className="p-3 font-semibold">Booked</th>
                  <th className="p-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const c = companies.find((x) => x.slug === b.company_id);
                  const t = TIMESLOTS.find((x) => x.id === b.timeslot_id);
                  return (
                    <tr key={b.id} className="border-t border-border align-top">
                      <td className="p-3 font-semibold text-navy">
                        {b.full_name}
                        <div className="text-xs font-normal text-muted-foreground">{b.job_title}</div>
                      </td>
                      <td className="p-3">{b.organisation}</td>
                      <td className="p-3">{c?.name ?? b.company_id}</td>
                      <td className="p-3">
                        {getSlotInfo(b.timeslot_id).label}
                        <div className="text-xs text-muted-foreground">{getSlotInfo(b.timeslot_id).time}</div>
                      </td>
                      <td className="p-3">
                        <a href={`mailto:${b.email}`} className="text-primary hover:underline">
                          {b.email}
                        </a>
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      </td>
                      <td className="p-3">{b.primary_interest ?? "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleCancel(b)}
                          disabled={cancelling === b.id}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {cancelling === b.id ? "…" : "Cancel"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {bookings.some((b) => b.notes) && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-navy">Notes from applicants</h3>
            <div className="mt-3 space-y-2">
              {bookings
                .filter((b) => b.notes)
                .map((b) => (
                  <div key={b.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                    <span className="font-semibold text-navy">{b.full_name}:</span>{" "}
                    <span className="text-foreground/85">{b.notes}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ACTIVITY LOG */}
        <h2 className="mt-12 text-lg font-bold text-navy">Activity Log</h2>
        <p className="text-sm text-muted-foreground">
          Every booking and cancellation, in order — including who cancelled it.
        </p>
        {events.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No activity yet.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {events.map((ev) => {
              const c = companies.find((x) => x.slug === ev.company_id);
              const t = TIMESLOTS.find((x) => x.id === ev.timeslot_id);
              const style = eventStyle(ev.event_type);
              return (
                <div
                  key={ev.id}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm ${style.wrap}`}
                >
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="font-semibold text-navy">{ev.full_name}</span>
                  {ev.organisation && <span className="text-muted-foreground">({ev.organisation})</span>}
                  <span className="text-muted-foreground">·</span>
                  <span>{c?.name ?? ev.company_id}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{getSlotInfo(ev.timeslot_id).label} {getSlotInfo(ev.timeslot_id).time}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {new Date(ev.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function eventStyle(type: BookingEvent["event_type"]) {
  switch (type) {
    case "booked":
      return {
        label: "Booked",
        wrap: "border-green-200 bg-green-50",
        badge: "bg-green-600 text-white",
      };
    case "cancelled_by_user":
      return {
        label: "Cancelled (self)",
        wrap: "border-amber-200 bg-amber-50",
        badge: "bg-amber-600 text-white",
      };
    case "cancelled_by_admin":
      return {
        label: "Cancelled (admin)",
        wrap: "border-red-200 bg-red-50",
        badge: "bg-red-600 text-white",
      };
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
