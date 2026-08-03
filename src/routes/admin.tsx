import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { companies } from "@/data/companies";
import { EVENT_DATE, TIMESLOTS } from "@/data/timeslots";
import { supabase } from "@/lib/supabase-client";
import { adminListBookings, adminCancelBooking, type AdminBooking } from "@/lib/booking.server";
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
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const pwRef = useRef("");

  const load = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await adminListBookings({ data: { password: pw } });
    setLoading(false);
    if (!res.ok) {
      setAuthError("Incorrect password.");
      setAuthed(false);
      return false;
    }
    setBookings(res.bookings);
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

  const totalSlots = companies.length * TIMESLOTS.length;

  // ── LOGIN GATE ──────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-elegant">
          <img src={kimstLogo} alt="KIMST" className="h-11 w-auto object-contain" />
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
            <img src={kimstLogo} alt="KIMST" className="h-12 w-auto object-contain" />
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total bookings" value={`${bookings.length}`} />
          <Stat label="Slots filled" value={`${bookings.length} / ${totalSlots}`} />
          <Stat label="Companies" value={`${companies.length}`} />
          <Stat label="Sessions" value={`${TIMESLOTS.length}`} />
        </div>

        {/* GRID VIEW */}
        <h2 className="mt-10 text-lg font-bold text-navy">Slot Grid</h2>
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
                        {t?.label}
                        <div className="text-xs text-muted-foreground">{t?.time}</div>
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
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
