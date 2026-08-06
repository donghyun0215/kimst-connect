export interface Timeslot {
  id: string;
  label: string;
  time: string;
}

export const EVENT_DATE = "Wednesday, 2 September 2026";
export const EVENT_TIME = "10:00 – 16:00";
// Venue is being finalised — shown as TBC across the site until confirmed.
export const EVENT_VENUE = "Venue to be confirmed";
export const EVENT_ADDRESS = "Sentosa, Singapore · details announced soon";

// 1:1 meetup rounds ("Session" is reserved for the program blocks below)
export const TIMESLOTS: Timeslot[] = [
  { id: "slot1", label: "Round 1", time: "14:00 – 14:30" },
  { id: "slot2", label: "Round 2", time: "14:50 – 15:20" },
];

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
    dateLabel: "Monday, 7 September 2026",
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
// (YS Bio and Con Trâu Eco meet 1:1 at the 2 Sep Open Innovation Day only.)
export const NULDAM_COMPANY_SLUGS: Record<"track1" | "track2", string[]> = {
  track1: ["cutshion", "doublt", "willog", "xylolabs"],
  track2: ["eastsea-brother", "haesong-snt"],
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
