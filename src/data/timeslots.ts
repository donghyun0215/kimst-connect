export interface Timeslot {
  id: string;
  label: string;
  time: string;
}

export const EVENT_DATE = "Wednesday, 2 September 2026";
export const EVENT_TIME = "10:00 – 16:00";
export const EVENT_VENUE = "Resort World Convention Centre, Level 1, Virgo 4";
export const EVENT_ADDRESS = "8 Sentosa Gateway, Singapore 098269";

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
