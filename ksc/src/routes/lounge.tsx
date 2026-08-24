import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

const CHIP_COLORS: Record<string, string> = {
  Investment: "bg-emerald-100 text-emerald-800",
  Distribution: "bg-sky-100 text-sky-800",
  Partnership: "bg-violet-100 text-violet-800",
  Technology: "bg-amber-100 text-amber-800",
};

function avatarHue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
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

function LoungePage() {
  const { key } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState<LoungeProfile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [gateError, setGateError] = useState("");
  const [grantedEmail, setGrantedEmail] = useState<string | null>(null);

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
          ? "This access link is no longer active. Please enter the email you used to RSVP."
          : "We couldn't find an RSVP with this email. Please use the email you registered with.",
      );
    }
  };

  useEffect(() => {
    if (key) void load({ key });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const submitContact = async () => {
    if (!cEmail.trim() || cBusy) return;
    setCBusy(true);
    setCMsg(null);
    const res = await updateContactUrl({ data: { email: cEmail.trim(), contactUrl: cUrl } });
    setCBusy(false);
    setCMsg(res.ok ? { ok: true, text: "Saved! Your card is updated." } : { ok: false, text: res.message ?? "Something went wrong." });
    if (res.ok && profiles) {
      // refresh with whatever auth we already hold
      void load(key ? { key } : grantedEmail ? { email: grantedEmail } : { email: cEmail.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <img src={kimstLogo} alt="KIMST" className="h-10 w-auto object-contain sm:h-12" />
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              K-Marine Tech Open Innovation Day
            </div>
            <div className="text-sm font-bold text-navy">Virtual Networking Lounge</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-8">
        {!profiles ? (
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h1 className="font-display text-xl font-bold text-navy">Attendees only</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email you used to RSVP to browse fellow attendees' cards and continue
                the conversations from 2 September.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email.trim() && void load({ email: email.trim() })}
                placeholder="you@company.com"
                className="mt-4 w-full rounded-lg border border-input px-3 py-2 text-sm"
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
              <p className="mt-3 text-[11px] text-muted-foreground">
                Cards show name, organisation and job title only — emails and phone numbers are
                never displayed.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-navy">Attendees</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profiles.length} people joined on 2 September. Reach out via their contact links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowContactForm((v) => !v);
                  if (grantedEmail && !cEmail) setCEmail(grantedEmail);
                }}
                className="rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                {showContactForm ? "Close" : "Add / update my contact link"}
              </button>
            </div>

            {showContactForm && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="Email you RSVP'd with"
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                  />
                  <input
                    value={cUrl}
                    onChange={(e) => setCUrl(e.target.value)}
                    placeholder="linkedin.com/in/yourname · company site · open chat"
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={cBusy || !cEmail.trim()}
                    onClick={() => void submitContact()}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {cBusy ? "Saving…" : "Save"}
                  </button>
                  {cMsg && (
                    <span className={`text-xs ${cMsg.ok ? "text-green-700" : "text-red-600"}`}>{cMsg.text}</span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: `hsl(${avatarHue(p.full_name)} 55% 45%)` }}
                    >
                      {initials(p.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-navy">{p.full_name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.job_title} @ {p.organisation}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-1 items-end justify-between gap-2">
                    {p.primary_interest ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          CHIP_COLORS[p.primary_interest] ?? "bg-secondary text-navy"
                        }`}
                      >
                        {p.primary_interest}
                      </span>
                    ) : (
                      <span />
                    )}
                    {p.contact_url && (
                      <a
                        href={p.contact_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-navy/85"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                        </svg>
                        {contactLabel(p.contact_url)}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-[11px] text-muted-foreground">
              Visible to event attendees only · emails and phone numbers are never shown ·
              to remove your card, contact the organisers
            </p>
          </>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Hosted by KIMST · Organized by MYSC &amp; LodestarT
        </footer>
      </main>
    </div>
  );
}
