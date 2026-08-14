export interface Timeslot {
  id: string;
  label: string;
  time: string;
}

export const EVENT_DATE = "Wednesday, 2 September 2026";
export const EVENT_TIME = "10:00 – 16:00";
export const EVENT_VENUE = "Suntec Singapore Convention & Exhibition Centre, Level 3, Room 302";
export const EVENT_ADDRESS = "1 Raffles Boulevard, Singapore 039593";
// Opens the venue in Google Maps (app on mobile, browser on desktop)
export const EVENT_MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Suntec+Singapore+Convention+%26+Exhibition+Centre+1+Raffles+Boulevard+Singapore+039593";

// 1:1 meetup rounds ("Session" is reserved for the program blocks below)
export const TIMESLOTS: Timeslot[] = [
  { id: "slot1", label: "Round 1", time: "14:00 – 14:30" },
  { id: "slot2", label: "Round 2", time: "14:50 – 15:20" },
  { id: "slot3", label: "Round 3", time: "15:30 – 16:00" },
];

// Round 3 is an extra ad-hoc round — only these companies take bookings for it.
export const ROUND3_COMPANY_SLUGS = ["xylolabs"];

export function isSlotOffered(companySlug: string, timeslotId: string): boolean {
  return timeslotId !== "slot3" || ROUND3_COMPANY_SLUGS.includes(companySlug);
}

export interface ProgramBlock {
  id: "showcase" | "lunch" | "meetups";
  title: string;
  time: string;
  description: string;
}

export const PROGRAM: ProgramBlock[] = [
  {
    id: "showcase",
    title: "Success Story Showcase",
    time: "10:30 – 12:30",
    description: "Hear how Korea's marine-tech startups scaled — insights straight from the founders.",
  },
  {
    id: "lunch",
    title: "Networking Lunch",
    time: "12:30 – 14:00",
    description: "Complimentary buffet. Connect with founders, corporates, and investors.",
  },
  {
    id: "meetups",
    title: "1:1 Onsite Meetups",
    time: "14:00 – 15:20",
    description: "Private 30-minute meetings with the startups of your choice — two rounds, one company each.",
  },
];

// ── Nuldam 1:1 in-depth meetings (separate booking from the 9/2 event) ──
export const NULDAM_VENUE = "Nuldam Space, SCAPE #02-14/15";
export const NULDAM_ADDRESS = "2 Orchard Link, Singapore 237878";
// Opens the venue in Google Maps (works in the app on mobile, browser on desktop)
export const NULDAM_MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Nuldam+Space+SCAPE+2+Orchard+Link+Singapore+237878";

export interface NuldamTrack {
  id: "track1" | "track2";
  dateLabel: string;
  timeRange: string;
  slots: Timeslot[]; // 30-minute slots
}

export const NULDAM_TRACKS: NuldamTrack[] = [
  {
    id: "track1",
    dateLabel: "Monday, 31 August 2026",
    timeRange: "10:30 – 12:10 & 14:00 – 15:40",
    slots: [
      { id: "n1-1030", label: "10:30", time: "10:30 – 11:10" },
      { id: "n1-1130", label: "11:30", time: "11:30 – 12:10" },
      { id: "n1-1400", label: "14:00", time: "14:00 – 14:40" },
      { id: "n1-1500", label: "15:00", time: "15:00 – 15:40" },
    ],
  },
  {
    id: "track2",
    dateLabel: "Friday, 4 September 2026",
    timeRange: "14:00 – 17:00",
    slots: [
      { id: "n2-1400", label: "14:00", time: "14:00 – 14:40" },
      { id: "n2-1450", label: "14:50", time: "14:50 – 15:30" },
      { id: "n2-1540", label: "15:40", time: "15:40 – 16:20" },
      { id: "n2-1630", label: "16:30", time: "16:30 – 17:00" },
    ],
  },
];

// Which companies take part in the Nuldam in-depth meetings.
// (YS Bio and East Sea Brother meet 1:1 at the 2 Sep Open Innovation Day only —
//  East Sea Brother attends 4 Sep mornings only, so Con Trâu Eco takes the
//  afternoon 1:1 slot per the organisers.)
export const NULDAM_COMPANY_SLUGS: Record<"track1" | "track2", string[]> = {
  track1: ["cutshion", "doublt", "willog", "xylolabs"],
  track2: ["contrau-eco", "haesong-snt"],
};

export function isNuldamCompany(slug: string): boolean {
  return NULDAM_COMPANY_SLUGS.track1.includes(slug) || NULDAM_COMPANY_SLUGS.track2.includes(slug);
}

// Global slot lookup (event rounds + all Nuldam slots) for labels anywhere.
export interface SlotInfo {
  label: string;
  time: string;
  context: string; // where/when this slot happens
}

const slotIndex: Record<string, SlotInfo> = {};
for (const t of TIMESLOTS) {
  slotIndex[t.id] = { label: `1:1 ${t.label}`, time: t.time, context: `Open Innovation Day · ${EVENT_DATE}` };
}
for (const track of NULDAM_TRACKS) {
  for (const s of track.slots) {
    slotIndex[s.id] = {
      label: track.id === "track1" ? "Nuldam · Track 1" : "Nuldam · Track 2",
      time: s.time,
      context: `${track.dateLabel} · ${NULDAM_VENUE}`,
    };
  }
}

export function getSlotInfo(id: string): SlotInfo {
  return slotIndex[id] ?? { label: id, time: "", context: "" };
}
