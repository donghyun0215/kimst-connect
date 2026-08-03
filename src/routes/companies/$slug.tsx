import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCompanyBySlug, TRACKS } from "@/data/companies";
import { STARTUP_IMAGES, STARTUP_LOGOS } from "@/data/companyImages";
import kimstLogo from "@/assets/kimst-logo.png";

export const Route = createFileRoute("/companies/$slug")({
  component: CompanyOnePager,
  loader: ({ params }) => {
    const company = getCompanyBySlug(params.slug);
    if (!company) throw notFound();
    return company;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — KIMST Singapore Startup Accelerator 2026` },
          { name: "description", content: loaderData.tagline },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-navy">Company not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          ← Back to all startups
        </Link>
      </div>
    </div>
  ),
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{children}</div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-foreground/85">
          <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-8">
      <Eyebrow>{title}</Eyebrow>
      <Bullets items={items} />
    </div>
  );
}

function CompanyOnePager() {
  const company = Route.useLoaderData();
  const track = TRACKS[company.track];
  const image = STARTUP_IMAGES[company.slug];
  const logo = STARTUP_LOGOS[company.slug];

  return (
    <div className="min-h-screen bg-background">
      {/* NAV — same pattern as landing */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center">
            <img src={kimstLogo} alt="KIMST" className="h-14 w-auto shrink-0 object-contain sm:h-16" />
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              to="/"
              hash="startups"
              className="rounded-full bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-secondary-foreground transition hover:bg-accent sm:px-4 sm:py-2 sm:text-sm"
            >
              All Startups
            </Link>
            <Link
              to="/book"
              search={{ company: company.slug }}
              className="rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:px-4 sm:py-2 sm:text-sm"
            >
              Book a 1:1 Meeting
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO — same gradient + wave language as landing */}
      <section className="relative isolate overflow-hidden bg-hero-gradient text-primary-foreground">
        <div
          className="absolute inset-0 -z-10 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, oklch(0.68 0.18 245 / 0.5), transparent 45%), radial-gradient(circle at 85% 80%, oklch(0.35 0.18 265 / 0.6), transparent 45%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-6 sm:pt-16 md:pb-32">
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div>
              <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-2 text-[11px] font-medium backdrop-blur-sm sm:text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-foreground animate-pulse" />
                  {track.title}
                </span>
                <span className="hidden h-3.5 w-px bg-primary-foreground/50 sm:block" />
                <span>{track.dates}</span>
              </div>
              {logo && (
                <div className="mt-6 inline-flex items-center rounded-xl bg-white px-5 py-3.5 shadow-elegant">
                  <img src={logo} alt={`${company.name} logo`} className="h-9 w-auto object-contain sm:h-11" />
                </div>
              )}
              <h1 className="mt-6 bg-gradient-to-r from-white to-light-blue bg-clip-text text-4xl font-bold leading-[1.05] text-transparent sm:text-5xl md:text-6xl">
                {company.displayName}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/90 sm:text-lg">
                {company.tagline}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs font-medium sm:text-sm">
                <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5">{company.sector}</span>
                <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5">{company.stage}</span>
              </div>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  search={{ company: company.slug }}
                  className="btn-hero inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                >
                  Book a 1:1 Meeting
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline-hero inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                  >
                    Visit Website ↗
                  </a>
                )}
              </div>
            </div>

            {image && (
              <div className="relative hidden md:block">
                <div className="overflow-hidden rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 shadow-elegant">
                  <img
                    src={image}
                    alt={company.name}
                    className="aspect-[3/2] w-full object-cover"
                    width={1200}
                    height={800}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* wave divider — identical to landing */}
        <svg
          className="absolute bottom-0 left-0 right-0 h-16 w-full text-background"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0 40 Q 360 80 720 40 T 1440 40 L1440 80 L0 80 Z" />
        </svg>
      </section>

      {/* PROBLEM / SOLUTION / FEATURES / AUDIENCE / MODEL / SEEKING */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <Eyebrow>Startup One-Pager</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-navy md:text-4xl">At a Glance</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard title="Problem" items={company.problem} />
          <InfoCard title="Solution" items={company.solution} />
          <InfoCard title="Key Features" items={company.keyFeatures} />
          <div className="grid gap-5">
            <InfoCard title="Target Audience" items={company.targetAudience} />
            <InfoCard title="Business Model" items={company.businessModel} />
          </div>
        </div>
      </section>

      {/* BUSINESS SNAPSHOT — dark band, mirrors the About KIMST section */}
      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                Business Snapshot
              </div>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Traction & Milestones</h2>
              <div className="mt-8 hidden md:block">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                  Seeking in Singapore
                </div>
                <ul className="mt-4 space-y-3">
                  {company.seekingOpportunities.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-primary-foreground/90">
                      <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-light-blue" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:col-span-3">
              {company.businessSnapshot.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 text-sm leading-relaxed backdrop-blur-sm"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="md:hidden">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                Seeking in Singapore
              </div>
              <ul className="mt-4 space-y-3">
                {company.seekingOpportunities.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-primary-foreground/90">
                    <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-light-blue" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20">
        <div className="mb-10">
          <Eyebrow>Team</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-navy md:text-4xl">Who You'll Meet</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {company.team.map((member) => (
            <div key={member.name} className="card-startup rounded-xl p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-display text-base font-bold text-primary">
                {member.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div className="mt-4 text-base font-bold text-navy">{member.name}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">{member.role}</div>
              <ul className="mt-3 space-y-1.5">
                {member.bio.map((line, i) => (
                  <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative overflow-hidden bg-background">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, var(--primary), transparent 40%), radial-gradient(circle at 80% 70%, var(--primary), transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold text-navy md:text-3xl">
              Meet {company.name} in Singapore
            </h2>
            <p className="mt-3 text-muted-foreground">
              Reserve a private 30-minute 1:1 session on 2 September 2026 to discuss pilots,
              partnerships, or investment.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/book"
                search={{ company: company.slug }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Book a 1:1 Meeting
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                to="/"
                hash="startups"
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-background px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                ← All Startups
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER — condensed version of landing footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <img src={kimstLogo} alt="KIMST" className="h-16 w-auto object-contain" />
          <div className="text-xs text-muted-foreground">
            © 2026 KIMST · Singapore Startup Accelerator Program
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="hover:underline">
                {company.email}
              </a>
            )}
            {company.phone && <span>{company.phone}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
