import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import kimstLogo from "@/assets/kimst-logo.png";

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
