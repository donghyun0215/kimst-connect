import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import kimstLogo from "@/assets/kimst-logo.png";
import { companies } from "@/data/companies";
import { EVENT_DATE, EVENT_VENUE, NULDAM_TRACKS, NULDAM_COMPANY_SLUGS, TIMESLOTS, isSlotOffered } from "@/data/timeslots";
import { fetchMeetingRoster, type RosterEntry } from "@/lib/booking.server";

// Unlisted internal page for programme stakeholders — intentionally not linked
// from any navbar/footer and marked noindex. Share by URL only.
export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
  head: () => ({
    meta: [
      { title: "Programme Schedule — KIMST Singapore Global Programme 2026" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Detailed day-by-day itinerary for participating startups and partners.",
      },
    ],
  }),
});

interface ScheduleItem {
  time?: string; // e.g. "10:00 – 12:30"
  title: string;
  venue?: string;
  note?: string;
  highlight?: boolean; // key session — filled chip
}

interface ScheduleDay {
  date: string; // "8/26"
  dow: string; // "수"
  theme: string; // main theme
  headcount?: string;
  transport?: string;
  items: ScheduleItem[];
  free?: boolean; // 자유일정
  joint?: boolean; // 트랙 통합일
}

const TRACK1_DAYS: ScheduleDay[] = [
  {
    date: "8/26", dow: "수", theme: "싱가포르 IN",
    headcount: "4명 (2 스타트업, 1 MYSC, 1 Lodestart)",
    transport: "KIMST 불참 시 그랩 이용",
    items: [
      { title: "싱가포르 입국 및 호텔 이동", note: "SIN 도착 14:20" },
      { time: "18:00", title: "저녁 식사 · 웰컴 디너 및 OT", highlight: true },
      { time: "20:00", title: "체크인 및 휴식" },
    ],
  },
  {
    date: "8/27", dow: "목", theme: "박람회",
    headcount: "8명 (6 스타트업, 1 MYSC, 1 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { title: "AIMX 박람회", venue: "Marina Bay Sands Expo", note: "점심식사 기업 자부담", highlight: true },
      { time: "18:00", title: "저녁식사 및 박람회 성과/후기 정리" },
      { time: "20:00", title: "휴식" },
    ],
  },
  {
    date: "8/28", dow: "금", theme: "PoC 현장 방문",
    headcount: "9명 (6 스타트업, 1 MYSC, 2 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { time: "10:00", title: "기관 방문 (해양수산·창업 중간지원조직)", venue: "RightShip Zero Harm Innovation Partners Program, 20 Cecil St #13-06 PLUS, Singapore 049705", highlight: true },
      { time: "12:00", title: "점심식사" },
      { time: "15:00 – 16:30", title: "PoC 현장 방문 (항만·선사·조선) · HLBN 정연호 부사장", venue: "10 Anson Road #36-12, International Plaza, Singapore 079903", highlight: true },
      { time: "17:00", title: "방문: URA", venue: "Singapore City Gallery" },
      { time: "18:00", title: "저녁식사 및 PoC 현장 방문 성과/후기 정리" },
      { time: "20:00", title: "휴식" },
    ],
  },
  { date: "8/29", dow: "토", theme: "자유일정", free: true, items: [] },
  { date: "8/30", dow: "일", theme: "자유일정", free: true, items: [] },
  {
    date: "8/31", dow: "월", theme: "1:1 밋업",
    headcount: "9명 (6 스타트업, 1 MYSC, 2 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { time: "10:30 – 12:30", title: "[파트너 매칭] 비즈니스 밋업 (기업당 2인)", venue: "Nuldam Space, SCAPE #02-14/15", highlight: true },
      { time: "12:00", title: "점심식사" },
      { time: "14:00 – 16:00", title: "[파트너 매칭] 비즈니스 밋업 (기업당 2인)", venue: "Nuldam Space, SCAPE #02-14/15", highlight: true },
      { time: "18:00", title: "저녁식사 및 비즈니스 밋업 성과/후기 정리" },
      { time: "20:00", title: "휴식" },
    ],
  },
  {
    date: "9/1", dow: "화", theme: "자유일정 (기업 자율)",
    headcount: "12명 (6 스타트업, 2 MYSC, 2 KIMST, 2 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { time: "12:00", title: "점심식사" },
      { time: "14:00 – 17:00", title: "[기업 자율] 비즈니스 밋업", venue: "Nuldam Space, 2 Orchard Link #02-14/15, SCAPE, Singapore 237978", highlight: true },
      { time: "17:00", title: "집결 및 이동" },
      { time: "18:00", title: "저녁식사 및 자율 밋업 성과/후기 정리" },
      { time: "20:00", title: "휴식" },
    ],
  },
  {
    date: "9/2", dow: "수", theme: "트랙 1·2 통합", joint: true,
    headcount: "25명 (15 스타트업, 3 MYSC, 2 KIMST, 3 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { title: "EMA-MARINE 비즈니스 밋업 데이", venue: "Suntec Singapore Convention & Exhibition Centre, Level 3, Room 302, 1 Raffles Boulevard Singapore 039593", highlight: true },
      { time: "17:00", title: "집결 및 이동" },
      { time: "18:00", title: "네트워킹 디너", venue: "해녀의부엌", highlight: true },
    ],
  },
  {
    date: "9/3", dow: "목", theme: "PoC 현장 방문",
    headcount: "10명 (5 스타트업, 1 MYSC, 2 KIMST, 2 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { time: "10:00", title: "PIER71 방문 (해양수산·창업 중간지원조직)", venue: "PIER71 (BLOCK71 Singapore)", highlight: true },
      { time: "12:00", title: "점심식사" },
      { time: "15:00 – 17:00", title: "PoC 현장 방문 (항만·선사·조선)", venue: "ACE", highlight: true },
      { time: "17:00", title: "KOCHAM 갈라 디너", venue: "W Singapore – Sentosa Cove, 21 Ocean Way, Singapore 098374", highlight: true },
    ],
  },
  {
    date: "9/4", dow: "금", theme: "싱가포르 OUT",
    headcount: "9명 (5 스타트업, 2 MYSC, 2 KIMST)",
    transport: "호텔 → 공항 그랩 이용",
    items: [{ title: "공항 이동 및 출국", note: "SIN 출발 14:55" }],
  },
];

const TRACK2_DAYS: ScheduleDay[] = [
  {
    date: "9/1", dow: "화", theme: "싱가포르 IN",
    headcount: "7명 (6 스타트업, 1 MYSC)",
    items: [
      { title: "싱가포르 입국 및 호텔 이동", note: "SIN 도착 16:35" },
      { time: "18:00", title: "저녁식사 · 트랙 1과 동일", highlight: true },
      { time: "20:00", title: "체크인 및 휴식" },
    ],
  },
  {
    date: "9/2", dow: "수", theme: "트랙 1·2 통합", joint: true,
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { title: "EMA-MARINE 비즈니스 밋업 데이", venue: "Suntec Singapore Convention & Exhibition Centre, Level 3, Room 302, 1 Raffles Boulevard Singapore 039593", highlight: true },
      { time: "17:00", title: "집결 및 이동" },
      { time: "18:00", title: "네트워킹 디너", venue: "해녀의부엌", highlight: true },
    ],
  },
  {
    date: "9/3", dow: "목", theme: "박람회",
    headcount: "12명 (9 스타트업, 2 MYSC, 1 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { title: "Seafood Expo", venue: "Marina Bay Sands Expo", highlight: true },
      { time: "17:00", title: "집결 및 이동" },
      { time: "18:00", title: "KOCHAM 갈라 디너", venue: "W Singapore – Sentosa Cove, 21 Ocean Way, Singapore 098374", highlight: true },
    ],
  },
  {
    date: "9/4", dow: "금", theme: "허슬데이",
    headcount: "8명 (5 스타트업, 1 MYSC, 2 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { time: "10:00", title: "기관 방문: Innovate 360 (참여 인원 5)", venue: "2 Orchard Link #02-14/15, SCAPE", highlight: true },
      { time: "12:00", title: "점심식사" },
      { time: "14:00 – 17:00", title: "[파트너 매칭] 비즈니스 밋업 (기업당 2~3인)", venue: "Nuldam Space, 2 Orchard Link #02-14/15, SCAPE, Singapore 237978", highlight: true },
      { time: "18:00", title: "저녁식사 및 비즈니스 밋업 성과/후기 정리" },
      { time: "20:00", title: "휴식" },
    ],
  },
  { date: "9/5", dow: "토", theme: "자유일정", free: true, items: [] },
  { date: "9/6", dow: "일", theme: "자유일정", free: true, items: [] },
  {
    date: "9/7", dow: "월", theme: "현지 시장 조사",
    headcount: "5명 (2 스타트업, 1 MYSC, 2 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { title: "[기업 자율] 비즈니스 밋업" },
      { time: "12:00", title: "점심식사 · 기업 자부담" },
      { time: "14:00 – 17:00", title: "[기업 자율] 비즈니스 밋업", venue: "Nuldam Space, 2 Orchard Link #02-14/15, SCAPE, Singapore 237978", highlight: true },
      { time: "18:00", title: "저녁식사 및 현장 방문 성과/후기 정리 · 자유식" },
      { time: "20:00", title: "휴식" },
    ],
  },
  {
    date: "9/8", dow: "화", theme: "허슬데이",
    headcount: "5명 (2 스타트업, 1 MYSC, 2 Lodestart)",
    items: [
      { time: "9:00", title: "집결 및 이동" },
      { time: "10:00 – 11:00", title: "기관 방문: EDB", venue: "250 North Bridge Road, Raffles City Tower Level 28", highlight: true },
      { time: "12:00", title: "점심식사" },
      { time: "13:00 – 14:30", title: "기관 방문: raiSE", highlight: true },
      { time: "18:00", title: "저녁식사 및 비즈니스 밋업 성과/후기 정리" },
      { time: "20:00", title: "휴식" },
    ],
  },
  {
    date: "9/9", dow: "수", theme: "싱가포르 OUT",
    headcount: "5명 (2 스타트업, 1 MYSC, 2 Lodestart)",
    transport: "호텔 → 공항 그랩 이용",
    items: [{ title: "공항 이동 및 출국", note: "SIN 출발 08:10" }],
  },
];

const TRACK_META = [
  {
    id: "t1",
    label: "Track 1",
    title: "친환경 첨단선박",
    companies: "더블티 · 윌로그 · 자일로랩스 · 쿳션",
    period: "8/26 (수) – 9/4 (금)",
    days: TRACK1_DAYS,
    note: null as string | null,
  },
  {
    id: "t2",
    label: "Track 2",
    title: "스마트 블루푸드",
    companies: "동해형씨 · 해송물산 · 와이즈바이오* · 콘쩌우에코*",
    period: "9/1 (화) – 9/9 (수)",
    days: TRACK2_DAYS,
    note: "* 2개사는 9/2–9/3 일정 참석, 체제비 자부담",
  },
];

function SchedulePage() {
  const [trackId, setTrackId] = useState<"t1" | "t2">("t1");
  const [selectedDay, setSelectedDay] = useState<ScheduleDay | null>(null);
  const [view, setView] = useState<"itinerary" | "roster">("itinerary");
  const track = TRACK_META.find((t) => t.id === trackId)!;

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Nav — logo only, deliberately no site links (unlisted page) */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <img src={kimstLogo} alt="KIMST" className="h-10 w-auto object-contain sm:h-12" />
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Singapore Global Programme 2026
            </div>
            <div className="text-sm font-bold text-navy">상세 일정표</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">프로그램 상세 일정</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            참가 기업 및 파트너용 내부 일정표입니다 · 최신 업데이트 기준이며 현장 사정에 따라 변경될 수 있습니다
          </p>
        </div>

        {/* View menu */}
        <div className="mx-auto mt-6 flex w-fit rounded-full border border-border bg-card p-1 shadow-sm">
          {(
            [
              { id: "itinerary", label: "프로그램 일정" },
              { id: "roster", label: "1:1 미팅 로스터" },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                view === v.id ? "bg-primary text-primary-foreground shadow-sm" : "text-navy/70 hover:text-navy"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === "roster" ? (
          <MeetingRoster />
        ) : (
          <>
        {/* Track tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          {TRACK_META.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrackId(t.id as "t1" | "t2")}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                trackId === t.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-navy hover:border-primary/40"
              }`}
            >
              <div className={`text-[10px] font-semibold uppercase tracking-widest ${trackId === t.id ? "text-primary-foreground/80" : "text-primary"}`}>
                {t.label}
              </div>
              <div className="mt-0.5 text-sm font-bold leading-snug">{t.title}</div>
              <div className={`mt-0.5 truncate text-[11px] ${trackId === t.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {t.period}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm">
          <span className="font-semibold text-navy">{track.title}</span> · {track.companies}
          {track.note && <span className="block mt-1">{track.note}</span>}
        </div>

        {/* Desktop: at-a-glance grid (whole track on one screen) */}
        <div className="mt-6 hidden gap-3 lg:grid lg:grid-cols-5">
          {track.days.map((d) => (
            <button
              type="button"
              onClick={() => setSelectedDay(d)}
              key={`${track.id}-g-${d.date}`}
              className={`flex flex-col overflow-hidden rounded-xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 cursor-pointer ${
                d.free
                  ? "border-dashed border-border bg-card/50"
                  : d.joint
                    ? "border-primary/50 bg-card ring-1 ring-primary/20"
                    : "border-border bg-card"
              }`}
            >
              <div className={`px-3 py-2 ${d.joint ? "bg-primary/10" : d.free ? "" : "bg-secondary/60"}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-navy">
                    {d.date} <span className="text-[10px] font-semibold text-muted-foreground">({d.dow})</span>
                  </span>
                </div>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold leading-none ${
                  d.joint ? "bg-primary text-primary-foreground" : d.free ? "bg-muted text-muted-foreground" : "bg-navy/90 text-white"
                }`}>
                  {d.theme}
                </span>
              </div>
              {d.free ? (
                <div className="px-3 py-3 text-[11px] text-muted-foreground">자유일정</div>
              ) : (
                <div className="flex-1 space-y-1.5 px-3 py-2">
                  {d.items.map((it, i) => (
                    <div key={i} className="text-[11px] leading-snug">
                      {it.time && <span className="mr-1 font-bold text-primary">{it.time}</span>}
                      <span className={it.highlight ? "font-bold text-navy" : "text-navy/80"}>{it.title}</span>
                      {it.highlight && it.venue && (
                        <span className="block truncate text-[10px] font-semibold text-green-700" title={it.venue}>
                          📍 {it.venue}
                        </span>
                      )}
                      {it.note && <span className="block text-[10px] text-muted-foreground">{it.note}</span>}
                    </div>
                  ))}
                  {d.headcount && (
                    <div className="pt-1 text-[9px] text-muted-foreground">{d.headcount}</div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Mobile: day-by-day timeline */}
        <div className="mt-6 space-y-4 lg:hidden">
          {track.days.map((d) => (
            <section
              key={`${track.id}-${d.date}`}
              className={`overflow-hidden rounded-2xl border shadow-sm ${
                d.free
                  ? "border-dashed border-border bg-card/60"
                  : d.joint
                    ? "border-primary/40 bg-card"
                    : "border-border bg-card"
              }`}
            >
              <header
                className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 ${
                  d.joint ? "bg-primary/10" : d.free ? "" : "bg-secondary/60"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-navy">
                    {d.date} <span className="text-sm font-semibold text-muted-foreground">({d.dow})</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    d.joint ? "bg-primary text-primary-foreground" : d.free ? "bg-muted text-muted-foreground" : "bg-navy/90 text-white"
                  }`}>
                    {d.theme}
                  </span>
                </div>
                {d.headcount && (
                  <span className="text-[11px] font-medium text-muted-foreground">{d.headcount}</span>
                )}
              </header>

              {d.free ? (
                <div className="px-5 py-4 text-sm text-muted-foreground">자유일정</div>
              ) : (
                <div className="divide-y divide-border/70">
                  {d.items.map((it, i) => (
                    <div key={i} className="flex gap-3 px-5 py-2.5">
                      <span className="w-24 shrink-0 pt-0.5 text-xs font-bold text-primary">
                        {it.time ?? ""}
                      </span>
                      <span className="min-w-0">
                        <span className={`text-sm ${it.highlight ? "font-bold text-navy" : "font-medium text-navy/90"}`}>
                          {it.title}
                        </span>
                        {it.venue && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.venue)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-0.5 block text-xs underline underline-offset-2 ${it.highlight ? "font-semibold text-green-700" : "text-muted-foreground"}`}
                          >
                            📍 {it.venue}
                          </a>
                        )}
                        {it.note && <span className="mt-0.5 block text-xs text-muted-foreground">{it.note}</span>}
                      </span>
                    </div>
                  ))}
                  {d.transport && (
                    <div className="bg-secondary/40 px-5 py-2 text-[11px] text-muted-foreground">
                      차량: {d.transport}
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Hosted by KIMST · Organized by MYSC &amp; LodestarT
        </footer>

          </>
        )}

        {selectedDay && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          >
            <div
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <header className={`flex items-start justify-between gap-3 px-6 py-4 ${selectedDay.joint ? "bg-primary/10" : "bg-secondary/60"}`}>
                <div>
                  <div className="text-lg font-bold text-navy">
                    {selectedDay.date} ({selectedDay.dow})
                    <span className={`ml-2 rounded-full px-2.5 py-0.5 align-middle text-[11px] font-semibold ${
                      selectedDay.joint ? "bg-primary text-primary-foreground" : "bg-navy/90 text-white"
                    }`}>
                      {selectedDay.theme}
                    </span>
                  </div>
                  {selectedDay.headcount && (
                    <div className="mt-1 text-xs text-muted-foreground">{selectedDay.headcount}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-navy"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </header>
              <div className="divide-y divide-border/70 px-6">
                {selectedDay.free ? (
                  <div className="py-5 text-sm text-muted-foreground">자유일정</div>
                ) : (
                  selectedDay.items.map((it, i) => (
                    <div key={i} className="flex gap-3 py-3">
                      <span className="w-24 shrink-0 pt-0.5 text-xs font-bold text-primary">{it.time ?? ""}</span>
                      <span className="min-w-0">
                        <span className={`text-sm ${it.highlight ? "font-bold text-navy" : "font-medium text-navy/90"}`}>
                          {it.title}
                        </span>
                        {it.venue && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.venue)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-0.5 block text-xs underline underline-offset-2 transition hover:text-primary ${
                              it.highlight ? "font-semibold text-green-700" : "text-muted-foreground"
                            }`}
                          >
                            📍 {it.venue}
                          </a>
                        )}
                        {it.note && <span className="mt-0.5 block text-xs text-muted-foreground">{it.note}</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {selectedDay.transport && (
                <div className="bg-secondary/40 px-6 py-2.5 text-xs text-muted-foreground">차량: {selectedDay.transport}</div>
              )}
              <div className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


function LinkGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

function rosterInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function rosterContactLabel(url: string): string {
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  if (/open\.kakao\.com/i.test(url)) return "KakaoTalk";
  return "Website";
}

// ── 1:1 Meeting Roster — who each startup meets, round by round ──
const INTEREST_CHIP: Record<string, string> = {
  Investment: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Distribution / partnership": "bg-sky-50 text-sky-700 ring-sky-600/20",
  "Pilot / trial opportunity": "bg-violet-50 text-violet-700 ring-violet-600/20",
  "General interest": "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function MeetingRoster() {
  const [entries, setEntries] = useState<RosterEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<{ entry: RosterEntry; company: string; when: string } | null>(null);

  const load = async () => {
    setError(false);
    try {
      const res = await fetchMeetingRoster();
      setEntries(res.entries);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const byKey = new Map<string, RosterEntry>();
  for (const e of entries ?? []) byKey.set(`${e.company_id}:${e.timeslot_id}`, e);

  const dayCount = (entries ?? []).filter((e) => e.timeslot_id.startsWith("slot")).length;
  const nuldamCount = (entries ?? []).length - dayCount;

  const ordered = [...companies].sort((a, b) => (a.track === b.track ? a.name.localeCompare(b.name) : a.track.localeCompare(b.track)));

  const Line = ({ e, company, when }: { e: RosterEntry | undefined; company: string; when: string }) =>
    e ? (
      <button
        type="button"
        onClick={() => setSelected({ entry: e, company, when })}
        className="group flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-1 py-0.5 text-left transition hover:bg-primary/5"
      >
        <span className="truncate text-[13px] font-semibold text-navy group-hover:text-primary">{e.full_name}</span>
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {e.job_title} @ {e.organisation}
        </span>
        {e.primary_interest && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${
              INTEREST_CHIP[e.primary_interest] ?? "bg-secondary text-navy ring-border"
            }`}
          >
            {e.primary_interest}
          </span>
        )}
        {e.contact_url && <LinkGlyph className="h-3 w-3 shrink-0 text-primary" />}
      </button>
    ) : (
      <span className="text-xs text-muted-foreground/60">— 미배정 (오픈)</span>
    );

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-navy">1:1 미팅 로스터</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            기업별 미팅 상대 한 줄 프로필 · 이메일·연락처는 표시되지 않습니다
            {entries && <> · 확정 {dayCount + nuldamCount}건</>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-navy transition hover:bg-muted"
        >
          새로고침
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          로스터를 불러오지 못했습니다. 새로고침을 눌러주세요.
        </div>
      ) : !entries ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          불러오는 중…
        </div>
      ) : (
        <>
          {/* 2 Sep rounds */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">9월 2일 (수)</span>
            <span className="text-sm font-semibold text-navy">Open Innovation Day · 1:1 미팅</span>
            <span className="text-xs text-muted-foreground">{EVENT_VENUE} · 13:00–16:00</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {ordered.map((c) => {
              const isT1 = c.track === "track1";
              return (
                <section key={c.slug} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <header className={`flex items-center justify-between gap-3 border-b border-border px-5 py-3 ${isT1 ? "bg-primary/5" : "bg-secondary/60"}`}>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-navy">{c.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{c.sector}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${isT1 ? "bg-primary/10 text-primary" : "bg-navy/10 text-navy"}`}>
                      {isT1 ? "Track 1" : "Track 2"}
                    </span>
                  </header>
                  <ul className="divide-y divide-border/70">
                    {TIMESLOTS.filter((t) => isSlotOffered(c.slug, t.id)).map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="w-24 shrink-0">
                          <div className="text-[11px] font-bold text-primary">{t.label}</div>
                          <div className="text-[10px] tabular-nums text-muted-foreground">{t.time}</div>
                        </div>
                        <Line e={byKey.get(`${c.slug}:${t.id}`)} company={c.name} when={`${t.label} · ${t.time} · 9월 2일(수)`} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {/* Nuldam in-depth sessions */}
          <h3 className="mt-10 font-display text-lg font-bold text-navy">심층 1:1 (Nuldam Space)</h3>
          <p className="mt-1 text-xs text-muted-foreground">Track 1 — 8/31(월) · Track 2 — 9/4(금) · 40분 세션</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {NULDAM_TRACKS.map((tr) =>
              NULDAM_COMPANY_SLUGS[tr.id].map((slug) => {
                const c = companies.find((x) => x.slug === slug);
                if (!c) return null;
                return (
                  <section key={`${tr.id}-${slug}`} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <header className="flex items-center justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-navy">{c.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{tr.dateLabel}</div>
                      </div>
                    </header>
                    <ul className="divide-y divide-border/70">
                      {tr.slots.map((sl) => (
                        <li key={sl.id} className="flex items-center gap-3 px-5 py-2.5">
                          <div className="w-24 shrink-0">
                            <div className="text-[10px] tabular-nums text-muted-foreground">{sl.time}</div>
                          </div>
                          <Line e={byKey.get(`${slug}:${sl.id}`)} company={c.name} when={`${sl.time} · ${tr.dateLabel}`} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              }),
            )}
          </div>
        </>
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
                aria-label="닫기"
                className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-navy"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground ring-4 ring-background">
                {rosterInitials(selected.entry.full_name)}
              </div>
              <div className="mt-3 text-lg font-bold text-navy">{selected.entry.full_name}</div>
              {selected.entry.primary_interest && (
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                    INTEREST_CHIP[selected.entry.primary_interest] ?? "bg-background text-navy ring-border"
                  }`}
                >
                  {selected.entry.primary_interest}
                </span>
              )}
            </div>
            <div className="space-y-3 px-6 py-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">소속</div>
                <div className="mt-0.5 break-words text-sm font-semibold text-navy">{selected.entry.organisation}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">직함</div>
                <div className="mt-0.5 break-words text-sm text-navy/90">{selected.entry.job_title}</div>
              </div>
              <div className="rounded-lg bg-primary/5 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">미팅</div>
                <div className="mt-0.5 text-sm font-semibold text-navy">{selected.company}</div>
                <div className="text-xs text-muted-foreground">{selected.when}</div>
              </div>
              {selected.entry.contact_url ? (
                <a
                  href={selected.entry.contact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-navy py-2.5 text-sm font-semibold text-white transition hover:bg-navy/85"
                >
                  <LinkGlyph className="h-4 w-4" />
                  {rosterContactLabel(selected.entry.contact_url)} 프로필 열기
                </a>
              ) : (
                <p className="rounded-lg bg-secondary/60 px-3 py-2 text-center text-xs text-muted-foreground">
                  등록된 프로필 링크가 없습니다
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
