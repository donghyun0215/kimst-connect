import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import kimstLogo from "@/assets/kimst-logo.png";
import {
  listLoungeProfiles,
  updateContactUrl,
  type LoungeProfile,
} from "@/lib/booking.server";

// Unlisted attendee wall — QR (?key=) on event day, RSVP-email gate after.
// Not linked from any nav; noindex. PII beyond name/org/title never reaches
// this page (enforced server-side).
export const Route = createFileRoute("/lounge")({
  component: LoungePage,
  validateSearch: (s: Record<string, unknown>): { key?: string } =>
    typeof s.key === "string" && s.key ? { key: s.key } : {},
  head: () => ({
    meta: [
      { title: "Virtual Networking Lounge — KIMST Singapore Connect" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Attendee networking lounge for the K-Marine Tech Open Innovation Day." },
    ],
  }),
});

// Matches the exact values offered on the RSVP form.
const CHIP_COLORS: Record<string, string> = {
  Investment: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Distribution / partnership": "bg-sky-50 text-sky-700 ring-sky-600/20",
  "Pilot / trial opportunity": "bg-violet-50 text-violet-700 ring-violet-600/20",
  "General interest": "bg-slate-100 text-slate-600 ring-slate-500/20",
};
const BAR_COLORS: Record<string, string> = {
  Investment: "bg-emerald-500",
  "Distribution / partnership": "bg-sky-500",
  "Pilot / trial opportunity": "bg-violet-500",
  "General interest": "bg-slate-400",
};

// Marine palette — deliberately cool and within the KIMST family, so 57
// avatars read as one wall rather than a rainbow.
const AVATAR_COLORS = [
  "#123E6B", "#1668B8", "#0E7C86", "#2E7D6B", "#3F5B96", "#155E93", "#276749", "#2B4C7E",
];

function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function contactLabel(url: string): string {
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  if (/open\.kakao\.com/i.test(url)) return "KakaoTalk";
  return "Website";
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

// Faint marine glyphs — the subject's own vocabulary, kept quiet enough that
// the type stays the loudest thing on the screen.
function MarineWatermark() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-navy opacity-[0.045]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <pattern id="marine" width="112" height="112" patternUnits="userSpaceOnUse">
          {/* waves */}
          <path d="M8 22c6-6 12-6 18 0s12 6 18 0" />
          <path d="M8 30c6-6 12-6 18 0s12 6 18 0" />
          {/* hull */}
          <path d="M70 34h26l-5 9H75z" />
          <path d="M83 34V20l12 6-12 4" />
          {/* buoy / sensor */}
          <circle cx="24" cy="80" r="9" />
          <path d="M24 71v-8M24 89v8" />
          {/* propeller-ish rotor */}
          <path d="M84 78l10-6M84 78l10 6M84 78l-11 0" />
          <circle cx="84" cy="78" r="3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#marine)" />
    </svg>
  );
}

function LoungeNotice() {
  return (
    <section className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">
        Networking Lounge notice
      </h2>
      <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
        To facilitate professional networking during K-Marine Tech Open Innovation Day, this
        directory displays the name, organisation, designation and primary business interests of
        registered attendees.
      </p>
      <dl className="mt-3 space-y-2.5 text-[11px] leading-relaxed">
        <div>
          <dt className="inline font-semibold text-navy">Exclusive access. </dt>
          <dd className="inline text-muted-foreground">
            This directory is strictly private and accessible only to verified attendees present at
            the event.
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-navy">No direct contact info. </dt>
          <dd className="inline text-muted-foreground">
            Personal contact information such as email addresses and phone numbers is not displayed
            or shared.
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-navy">Data management. </dt>
          <dd className="inline text-muted-foreground">
            To update your details or opt out of being listed, use “Add or update my link” inside
            the lounge, or contact the organising team at{" "}
            <a href="mailto:support@lodestart.ai" className="font-medium text-primary hover:underline">
              support@lodestart.ai
            </a>
            .
          </dd>
        </div>
      </dl>
    </section>
  );
}

function LoungePage() {
  const { key } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState<LoungeProfile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [gateError, setGateError] = useState("");
  const [grantedEmail, setGrantedEmail] = useState<string | null>(null);

  const [selected, setSelected] = useState<LoungeProfile | null>(null);

  // browse controls
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState<string | null>(null);
  const [linkedOnly, setLinkedOnly] = useState(false);

  // contact mini-form
  const [showContactForm, setShowContactForm] = useState(false);
  const [cEmail, setCEmail] = useState("");
  const [cUrl, setCUrl] = useState("");
  const [cMsg, setCMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cBusy, setCBusy] = useState(false);

  const load = async (auth: { key?: string; email?: string }) => {
    setLoading(true);
    setGateError("");
    const res = await listLoungeProfiles({ data: auth });
    setLoading(false);
    if (res.ok) {
      setProfiles(res.profiles);
      if (auth.email) setGrantedEmail(auth.email);
    } else {
      setProfiles(null);
      setGateError(
        auth.key
          ? "This access link is no longer active. Enter the email you used to RSVP instead."
          : "No RSVP found with this email. Use the address you registered with.",
      );
    }
  };

  // A QR scan lands here holding a key, but we deliberately do not enter
  // automatically — the visitor gets a beat to read the notice and tap in.

  const submitContact = async () => {
    if (!cEmail.trim() || cBusy) return;
    setCBusy(true);
    setCMsg(null);
    const res = await updateContactUrl({ data: { email: cEmail.trim(), contactUrl: cUrl } });
    setCBusy(false);
    setCMsg(res.ok ? { ok: true, text: "Saved. Your card is updated." } : { ok: false, text: res.message ?? "Something went wrong." });
    if (res.ok) {
      void load(key ? { key } : grantedEmail ? { email: grantedEmail } : { email: cEmail.trim() });
    }
  };

  // "Who's here" composition — counts by interest, ordered by size.
  const groups = useMemo(() => {
    if (!profiles) return [];
    const m = new Map<string, number>();
    for (const p of profiles) {
      const k = p.primary_interest || "General interest";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [profiles]);

  const linkedCount = useMemo(() => profiles?.filter((p) => p.contact_url).length ?? 0, [profiles]);

  const shown = useMemo(() => {
    if (!profiles) return [];
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (interest && (p.primary_interest || "General interest") !== interest) return false;
      if (linkedOnly && !p.contact_url) return false;
      if (!q) return true;
      return `${p.full_name} ${p.organisation} ${p.job_title}`.toLowerCase().includes(q);
    });
  }, [profiles, query, interest, linkedOnly]);

  const filtersOn = Boolean(query.trim() || interest || linkedOnly);
  const clearFilters = () => {
    setQuery("");
    setInterest(null);
    setLinkedOnly(false);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-secondary/40">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <img src={kimstLogo} alt="KIMST" className="h-9 w-auto shrink-0 object-contain sm:h-11" />
          {profiles && (
            <div className="min-w-0 text-right">
              <div className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-primary sm:text-[10px] sm:tracking-[0.2em]">
                K-Marine Tech Open Innovation Day
              </div>
              <div className="truncate text-[13px] font-bold text-navy sm:text-sm">Virtual Networking Lounge</div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {!profiles ? (
          <div className="mx-auto max-w-md">
            {key && !gateError ? (
              /* QR arrival — welcome, then enter on tap */
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
                <MarineWatermark />
                <div className="relative">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    K-Marine Tech Open Innovation Day
                  </div>
                  <h1 className="mt-3 font-display text-[26px] font-bold uppercase leading-[1.15] tracking-tight text-navy sm:text-3xl">
                    Welcome to the
                    <br />
                    Virtual Networking Lounge
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    See who else is in the room today — name, company and role — and keep the
                    conversations going after the event.
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void load({ key })}
                    className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? "Opening…" : "Enter the lounge"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
                <MarineWatermark />
                <div className="relative">
                <h1 className="font-display text-xl font-bold text-navy">Attendees only</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the email you used to RSVP to browse everyone joining on 2 September and keep
                  the conversations going afterwards.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && email.trim() && void load({ email: email.trim() })}
                  placeholder="you@company.com"
                  className="mt-4 w-full rounded-lg border border-input px-3 py-2.5 text-base sm:text-sm"
                />
                {gateError && <p className="mt-2 text-xs text-red-600">{gateError}</p>}
                <button
                  type="button"
                  disabled={!email.trim() || loading}
                  onClick={() => void load({ email: email.trim() })}
                  className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Checking…" : "Enter the lounge"}
                </button>
                </div>
              </div>
            )}

            <LoungeNotice />
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[248px_1fr] lg:gap-8">
            {/* ── side rail ─────────────────────────────── */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="hidden lg:block">
                <h1 className="font-display text-2xl font-bold tracking-tight text-navy">Attendees</h1>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {profiles.length} people joined on 2 September.
                </p>
              </div>

              <div className="relative mt-4 lg:mt-5">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, company, role"
                  className="w-full rounded-full border border-input bg-background py-2.5 pl-9 pr-3 text-base outline-none ring-primary/30 transition focus:ring-2 sm:text-sm"
                />
              </div>

              {/* who's here — counts double as filters */}
              <div className="mt-4 hidden rounded-2xl border border-border bg-card p-4 shadow-sm lg:block">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Who's here
                </div>
                <div className="mt-3 space-y-2.5">
                  {groups.map(([label, n]) => {
                    const active = interest === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setInterest(active ? null : label)}
                        className="group w-full text-left"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-xs transition ${
                              active ? "font-semibold text-navy" : "text-navy/70 group-hover:text-navy"
                            }`}
                          >
                            {label}
                          </span>
                          <span className={`text-xs tabular-nums ${active ? "font-semibold text-navy" : "text-muted-foreground"}`}>
                            {n}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all ${BAR_COLORS[label] ?? "bg-slate-400"} ${
                              active ? "opacity-100" : "opacity-60 group-hover:opacity-90"
                            }`}
                            style={{ width: `${Math.round((n / profiles.length) * 100)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-border pt-3 text-xs text-navy/70">
                  <input
                    type="checkbox"
                    checked={linkedOnly}
                    onChange={(e) => setLinkedOnly(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[color:var(--primary)]"
                  />
                  <span>Has a contact link ({linkedCount})</span>
                </label>

                {filtersOn && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-[11px] font-semibold text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* mobile: horizontal filter chips */}
              <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {groups.map(([label, n]) => {
                  const active = interest === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setInterest(active ? null : label)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                        active
                          ? "bg-navy text-white ring-navy"
                          : "bg-card text-navy/70 ring-border"
                      }`}
                    >
                      {label} <span className="tabular-nums opacity-70">{n}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowContactForm((v) => !v);
                  if (grantedEmail && !cEmail) setCEmail(grantedEmail);
                }}
                className="mt-4 w-full rounded-full border border-primary/40 bg-card px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                {showContactForm ? "Close" : "Add or update my link"}
              </button>

              {showContactForm && (
                <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Add a LinkedIn profile, company page or open-chat link so others can reach you.
                    No re-registration needed.
                  </p>
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="Email you RSVP'd with"
                    className="mt-3 w-full rounded-lg border border-input px-3 py-2.5 text-base sm:text-sm"
                  />
                  <input
                    value={cUrl}
                    onChange={(e) => setCUrl(e.target.value)}
                    placeholder="linkedin.com/in/yourname"
                    className="mt-2 w-full rounded-lg border border-input px-3 py-2.5 text-base sm:text-sm"
                  />
                  <button
                    type="button"
                    disabled={cBusy || !cEmail.trim()}
                    onClick={() => void submitContact()}
                    className="mt-3 w-full rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {cBusy ? "Saving…" : "Save"}
                  </button>
                  {cMsg && (
                    <p className={`mt-2 text-[11px] ${cMsg.ok ? "text-green-700" : "text-red-600"}`}>{cMsg.text}</p>
                  )}
                </div>
              )}
            </aside>

            {/* ── card wall ─────────────────────────────── */}
            <section className="mt-6 lg:mt-0">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-navy lg:hidden">Attendees</h2>
                <p className="text-xs text-muted-foreground">
                  {filtersOn ? `${shown.length} of ${profiles.length}` : `${profiles.length} people`}
                  {interest && <> · {interest}</>}
                </p>
                {filtersOn && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[11px] font-semibold text-primary hover:underline lg:hidden"
                  >
                    Clear
                  </button>
                )}
              </div>

              {shown.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
                  <p className="text-sm font-semibold text-navy">No one matches that</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a different name or company, or clear the filters.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy transition hover:bg-muted"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {shown.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p)}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ring-2 ring-white"
                          style={{ backgroundColor: avatarColor(p.full_name) }}
                        >
                          {initials(p.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-navy">{p.full_name}</div>
                          <div className="line-clamp-2 break-words text-xs leading-snug text-muted-foreground">
                            {p.job_title}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-medium text-navy/60">
                            {p.organisation}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-1 items-end justify-between gap-2">
                        {p.primary_interest ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                              CHIP_COLORS[p.primary_interest] ?? "bg-secondary text-navy ring-border"
                            }`}
                          >
                            {p.primary_interest}
                          </span>
                        ) : (
                          <span />
                        )}
                        {p.contact_url ? (
                          <a
                            href={p.contact_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-navy/85"
                          >
                            <LinkIcon className="h-3 w-3" />
                            {contactLabel(p.contact_url)}
                          </a>
                        ) : (
                          <span className="shrink-0 text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100">
                            View →
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
                Visible to event attendees only · emails and phone numbers are never shown · to
                update or remove your card, contact{" "}
                <a href="mailto:support@lodestart.ai" className="font-medium text-primary hover:underline">
                  support@lodestart.ai
                </a>
              </p>
            </section>
          </div>
        )}

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-secondary/60 px-6 pb-6 pt-8 text-center">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-navy"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white ring-4 ring-background"
                  style={{ backgroundColor: avatarColor(selected.full_name) }}
                >
                  {initials(selected.full_name)}
                </div>
                <div className="mt-3 text-lg font-bold text-navy">{selected.full_name}</div>
                {selected.primary_interest && (
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                      CHIP_COLORS[selected.primary_interest] ?? "bg-background text-navy ring-border"
                    }`}
                  >
                    {selected.primary_interest}
                  </span>
                )}
              </div>
              <div className="space-y-3 px-6 py-5">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Organisation
                  </div>
                  <div className="mt-0.5 break-words text-sm font-semibold text-navy">{selected.organisation}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</div>
                  <div className="mt-0.5 break-words text-sm text-navy/90">{selected.job_title}</div>
                </div>
                {selected.contact_url ? (
                  <a
                    href={selected.contact_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-navy py-2.5 text-sm font-semibold text-white transition hover:bg-navy/85"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Connect on {contactLabel(selected.contact_url)}
                  </a>
                ) : (
                  <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-center text-xs text-muted-foreground">
                    No contact link added yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Hosted by KIMST · Organized by MYSC &amp; LodestarT
        </footer>
      </main>
    </div>
  );
}
