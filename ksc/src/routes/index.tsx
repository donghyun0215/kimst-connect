import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-singapore.jpg";
import kimstLogo from "@/assets/kimst-logo.png";
import { companies, TRACKS } from "@/data/companies";
import { STARTUP_IMAGES, STARTUP_LOGOS } from "@/data/companyImages";

export const Route = createFileRoute("/")({
  component: Landing,
});

const tracks = (["track1", "track2"] as const).map((trackId) => ({
  title: TRACKS[trackId].title,
  theme: TRACKS[trackId].theme,
  startups: companies
    .filter((c) => c.track === trackId)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      sector: c.sector,
      stage: c.stage,
      image: STARTUP_IMAGES[c.slug],
      logo: STARTUP_LOGOS[c.slug],
    })),
}));

function Landing() {
  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 md:flex md:justify-between">
          <a href="#top" className="flex min-w-0 items-center">
            <img
              src={kimstLogo}
              alt="KIMST Korea Institute of Marine Science & Technology Promotion"
              className="h-14 w-auto shrink-0 object-contain sm:h-16 md:h-20"
            />
          </a>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-3">
            <nav className="flex items-center gap-1.5 text-[11px] sm:gap-3 sm:text-sm">
              <a href="#rsvp" className="rounded-full bg-primary px-2.5 py-1.5 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:px-4 sm:py-2">RSVP</a>
              <a href="#startups" className="rounded-full bg-primary px-2.5 py-1.5 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:px-4 sm:py-2">Startups</a>
              <a href="#about" className="rounded-full bg-primary px-2.5 py-1.5 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:px-4 sm:py-2">About</a>
            </nav>
            <a
              href="mailto:support@lodestart.ai"
              className="rounded-full bg-sky-500 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-400 sm:px-4 sm:py-2 sm:text-sm"
            >
              Contact<span className="hidden sm:inline"> Organizer</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative isolate overflow-hidden bg-hero-gradient text-primary-foreground">
        <img
          src={heroImg}
          alt="Singapore Marina Bay skyline at blue hour"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[oklch(0.28_0.12_265)]/70 via-[oklch(0.35_0.18_265)]/60 to-[oklch(0.55_0.22_260)]/80" />

        <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-6 sm:pt-36 md:pb-40 md:pt-48">
          <div className="max-w-3xl">
            <div className="flex w-full flex-col gap-1.5 rounded-2xl border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-3 text-[11px] font-medium backdrop-blur-sm sm:inline-flex sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center sm:gap-x-4 sm:gap-y-2 sm:rounded-full sm:py-2 sm:text-xs">
              <span className="flex min-w-0 items-center gap-2 sm:whitespace-nowrap">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-foreground animate-pulse" />
                <span>{TRACKS.track1.title} ({TRACKS.track1.dates})</span>
              </span>
              <span className="hidden h-4 w-px shrink-0 bg-primary-foreground/50 sm:mx-2 sm:block" />
              <span className="pl-3.5 sm:whitespace-nowrap sm:pl-0">{TRACKS.track2.title} ({TRACKS.track2.dates})</span>
            </div>
            <h1 className="mt-6 bg-gradient-to-r from-white to-light-blue bg-clip-text text-4xl font-bold leading-[1.05] text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
              K-Marine Tech Open Innovation Week
            </h1>
            <p className="mt-4 max-w-2xl text-[1.5rem] leading-snug text-primary-foreground/90 md:text-[1.8rem]">
              Bringing & Scaling Korea's Proven Success to Singapore
            </p>
            <p className="mt-6 max-w-2xl text-[0.9rem] leading-relaxed text-primary-foreground/85 md:text-[1rem]">
              KIMST's flagship accelerator is bringing a selective group of pioneering Korean marine science
              and technology startups to Singapore. Connect with us to explore strategic partnerships: for
              corporates, discuss free trials or pilot testing opportunities; for investors,
              discover high-growth investment opportunities in cutting-edge maritime tech.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#rsvp"
                className="btn-hero inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Join EMA-Marine Day
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <Link
                to="/book"
                className="btn-outline-hero inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Schedule a 1:1 Meeting
              </Link>
            </div>

          </div>
        </div>

        {/* wave divider */}
        <svg className="absolute bottom-0 left-0 right-0 h-16 w-full text-background" viewBox="0 0 1440 80" preserveAspectRatio="none" fill="currentColor">
          <path d="M0 40 Q 360 80 720 40 T 1440 40 L1440 80 L0 80 Z" />
        </svg>
      </section>



      {/* CTA */}
      <section id="rsvp" className="relative overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, var(--primary), transparent 40%), radial-gradient(circle at 80% 70%, var(--primary), transparent 40%)"
        }} />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Join us</div>
            <h2 className="mt-3 text-3xl font-bold text-navy md:text-5xl">Strategic Partnerships</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect with us to explore impactful collaboration opportunities.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-500">For Corporates</div>
              <h3 className="mt-2 text-2xl font-bold text-navy">Tailored Pilot Testing & Free Trials</h3>
              <p className="mt-3 flex-1 text-muted-foreground">
                Explore free trials and pilot opportunities with leading Korean marine tech startups.
                Validate cutting-edge technology, test real-world use cases, and build scalable partnerships.
              </p>
              <a
                href="#startups"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Book a 1:1 meeting
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-500">For Investors</div>
              <h3 className="mt-2 text-2xl font-bold text-navy">High-Growth Maritime Tech Investments</h3>
              <p className="mt-3 flex-1 text-muted-foreground">
                Discover promising investment opportunities in cutting-edge maritime technology. Reserve a 30-minute
                private 1:1 session with startups matched to your sector preferences, investment stage, and expansion goals.
              </p>
              <a
                href="#startups"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Schedule a Meeting
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-500">Open to all</div>
              <h3 className="mt-2 text-2xl font-bold text-navy">EMA-Marine Day</h3>
              <p className="mt-3 flex-1 text-muted-foreground">
                Learn, Connect, and Scale: Discover how pioneering entrepreneurs partner with
                industry leaders to achieve mutual growth. Join our 1:1 Round Table Meetings and
                connect with key industry stakeholders during the networking session.
              </p>
              <Link
                to="/book"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Book a 1:1 Round Table
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STARTUPS */}
      <section id="startups" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Cohort 2026</div>
          <h2 className="mt-3 text-3xl font-bold text-navy md:text-4xl">Meet innovative Korean startups selected by KIMST</h2>
        </div>
        </div>

        <div className="space-y-20">
          {tracks.map((track) => (
            <div key={track.title}>
              <div className="mb-8 border-b border-border pb-4">
                <h3 className="text-xl font-bold text-navy md:text-2xl">{track.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{track.theme}</p>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {track.startups.map((s) => (
                  <div
                    key={s.slug}
                    className="card-startup group flex flex-col overflow-hidden rounded-xl"
                  >
                    <Link
                      to="/companies/$slug"
                      params={{ slug: s.slug }}
                      className="relative block aspect-[3/2] overflow-hidden bg-muted"
                    >
                      <img
                        src={s.image}
                        alt={`${s.name} — ${s.sector}`}
                        loading="lazy"
                        width={1200}
                        height={750}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      {s.logo && (
                        <span className="absolute bottom-2 left-2 inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                          <img src={s.logo} alt="" className="h-4 w-auto object-contain sm:h-5" />
                        </span>
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
                      <div className="truncate text-[10px] font-medium uppercase tracking-widest text-primary">{s.sector}</div>
                      <Link
                        to="/companies/$slug"
                        params={{ slug: s.slug }}
                        className="text-sm font-bold leading-snug text-navy hover:text-primary"
                      >
                        {s.name}
                      </Link>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{s.tagline}</p>
                  <div className="mt-auto flex w-full min-w-0 flex-col gap-2 pt-1">
                    <Link
                      to="/companies/$slug"
                      params={{ slug: s.slug }}
                      className="inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full border border-primary bg-background px-3 py-2 text-center text-[11px] font-semibold leading-tight text-primary shadow-sm transition hover:bg-primary/10"
                    >
                      <span className="truncate">View One-Pager</span>
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                    <Link
                      to="/book"
                      search={{ company: s.slug }}
                      className="inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-center text-[11px] font-semibold leading-tight text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                      <span className="truncate">Book a 1:1 Meeting</span>
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT KIMST */}
      <section id="about" className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">About KIMST</div>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Korea Institute of Marine Science & Technology Promotion
              </h2>
            </div>

            <div className="space-y-5 text-lg leading-relaxed text-primary-foreground/85 md:col-span-3">
              <p>
                KIMST is the Republic of Korea's public agency dedicated to advancing marine
                renaissance through science and technology. Under the Ministry of Oceans &
                Fisheries, we plan, fund, and manage the nation's marine R&D programs.
              </p>
              <p>
                Through the <span className="font-semibold text-primary-foreground">Singapore Startup Accelerator</span>,
                we bridge Korean deep-tech with Southeast Asian corporates, ports, and coastal markets —
                building the PoC partnerships and business channels that turn breakthrough marine science
                into commercial reality.
              </p>
              <div className="flex flex-wrap gap-6 pt-4">
                {[
                  ["₩1.2T+", "Annual R&D managed"],
                  ["500+", "Portfolio companies"],
                  ["25 yrs", "Advancing marine tech"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div className="text-2xl font-bold text-primary-foreground">{n}</div>
                    <div className="text-sm text-primary-foreground/80">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <img
                src={kimstLogo}
                alt="KIMST"
                className="h-20 w-auto object-contain"
              />


              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Korea Institute of Marine Science & Technology Promotion.<br />

                8F 9F 10F Dongwon F&B Building, Mabangro 60, Seocho-Ku, Seoul 06775, Republic of Korea
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <div>TEL +82-2-3460-4000</div>
              <div>E-MAIL kimst@kimst.re.kr</div>
              <a href="https://www.kimst.re.kr/e/main.do" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-primary hover:underline">
                www.kimst.re.kr →
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
            © 2026 KIMST · Singapore Startup Accelerator Program
          </div>
        </div>
      </footer>
    </div>
  );
}
