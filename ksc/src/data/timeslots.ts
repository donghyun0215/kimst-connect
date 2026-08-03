export interface Timeslot {
  id: string;
  label: string;
  time: string;
}

export const EVENT_DATE = "Wednesday, 2 September 2026";

export const TIMESLOTS: Timeslot[] = [
  { id: "slot1", label: "Session 1", time: "14:00 – 14:30" },
  { id: "slot2", label: "Session 2", time: "14:50 – 15:20" },
];
