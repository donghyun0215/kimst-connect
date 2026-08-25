import type { AdminBooking, AdminRsvp } from "./booking.server";
import { getCompanyBySlug } from "@/data/companies";
import {
  TIMESLOTS,
  EVENT_ADDRESS,
  EVENT_MAP_URL,
  EVENT_VENUE,
  NULDAM_ADDRESS,
  NULDAM_VENUE,
  PROGRAM,
  getSlotInfo,
} from "@/data/timeslots";

// Builds one personalised reminder email per RSVP: their programme-block
// choices plus any 1:1 meetings booked under the same email. Rendered in the
// admin dashboard for copy / mailto / CSV mail merge — the app itself sends
// no email (deliberate scope limit, see aidlc-docs).

export interface Reminder {
  email: string;
  name: string;
  subject: string;
  body: string;
  tags: string[]; // quick glance in the admin list, e.g. ["Showcase", "2 meetings"]
}

const SITE = "https://kimst-rsvp-2026.vercel.app";
const SUBJECT = "Your schedule — K-Marine Tech Open Innovation Day, 2 Sep";

const DAY_SLOT_IDS = new Set(TIMESLOTS.map((t) => t.id));

function programTime(id: "showcase" | "lunch" | "meetups"): string {
  return PROGRAM.find((b) => b.id === id)?.time ?? "";
}

export function buildReminders(rsvps: AdminRsvp[], bookings: AdminBooking[]): Reminder[] {
  const byEmail = new Map<string, AdminBooking[]>();
  for (const b of bookings) {
    const k = b.email.toLowerCase();
    byEmail.set(k, [...(byEmail.get(k) ?? []), b]);
  }

  return rsvps
    .slice()
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((r) => {
      const mine = byEmail.get(r.email.toLowerCase()) ?? [];
      const dayMeetings = mine
        .filter((b) => DAY_SLOT_IDS.has(b.timeslot_id))
        .sort((a, b) => a.timeslot_id.localeCompare(b.timeslot_id));
      const nuldamMeetings = mine
        .filter((b) => !DAY_SLOT_IDS.has(b.timeslot_id))
        .sort((a, b) => a.timeslot_id.localeCompare(b.timeslot_id));

      const schedule: string[] = [];
      if (r.attend_showcase) {
        schedule.push(`• Success Story Showcase — ${programTime("showcase")}\n  Eight Korean startups present across marine technology and food technology.`);
      }
      if (r.attend_lunch) {
        schedule.push(`• Networking Lunch — ${programTime("lunch")}\n  Complimentary buffet with the founders and fellow attendees.`);
      }
      for (const m of dayMeetings) {
        const slot = TIMESLOTS.find((t) => t.id === m.timeslot_id);
        const company = getCompanyBySlug(m.company_id)?.name ?? m.company_id;
        schedule.push(`• 1:1 Meeting with ${company} — ${slot?.time ?? ""} (${slot?.label ?? ""})`);
      }

      const lines: string[] = [];
      lines.push(`Dear ${r.full_name},`);
      lines.push("");
      lines.push("We're looking forward to welcoming you to the K-Marine Tech Open Innovation Day next week.");
      lines.push("");
      lines.push("📅 Wednesday, 2 September 2026 · 10:00 – 16:00");
      lines.push(`📍 ${EVENT_VENUE}`);
      lines.push(`   ${EVENT_ADDRESS}`);
      lines.push(`   Map: ${EVENT_MAP_URL}`);
      lines.push("");
      lines.push("YOUR SCHEDULE");
      lines.push("─────────────────────────────");
      if (schedule.length > 0) {
        lines.push(schedule.join("\n"));
      } else {
        lines.push("You're registered for the 1:1 Onsite Meetups session.");
      }
      if (dayMeetings.length === 0) {
        lines.push("");
        lines.push(`You haven't booked a 1:1 meeting with the startups yet — a few slots are still open: ${SITE}/book`);
      }
      if (nuldamMeetings.length > 0) {
        lines.push("");
        lines.push("ALSO ON YOUR CALENDAR");
        lines.push("─────────────────────────────");
        for (const m of nuldamMeetings) {
          const info = getSlotInfo(m.timeslot_id);
          const company = getCompanyBySlug(m.company_id)?.name ?? m.company_id;
          const day = (info.context ?? "").split("·")[0].trim(); // date portion only
          lines.push(`• In-depth 1:1 with ${company} — ${day}, ${info.time}`);
        }
        lines.push(`  ${NULDAM_VENUE}, ${NULDAM_ADDRESS}`);
      }
      if (r.additional_attendees) {
        lines.push("");
        lines.push(`Badges will be ready for you and ${r.additional_attendees}.`);
      }
      lines.push("");
      lines.push("BEFORE YOU COME");
      lines.push("─────────────────────────────");
      lines.push("We've opened a Virtual Networking Lounge — an attendee-only wall where you can see who else is joining and stay in touch afterwards:");
      lines.push(`${SITE}/lounge (enter this email address)`);
      lines.push("");
      lines.push("Please add your LinkedIn or a contact link there so others can reach you — it takes a few seconds, no re-registration needed. Only your name, organisation and job title are shown; emails and phone numbers never are.");
      lines.push("");
      lines.push(`Need to change anything? Look up your booking with this email at ${SITE}/book`);
      lines.push("");
      lines.push("See you on the 2nd.");
      lines.push("");
      lines.push("Warm regards,");
      lines.push("Donghyun Kim");
      lines.push("Lodestart Pte. Ltd. · on behalf of the KIMST Singapore Connect team");

      const tags: string[] = [];
      if (r.attend_showcase) tags.push("Showcase");
      if (r.attend_lunch) tags.push("Lunch");
      if (dayMeetings.length) tags.push(`${dayMeetings.length} meeting${dayMeetings.length > 1 ? "s" : ""}`);
      if (nuldamMeetings.length) tags.push("Nuldam");
      if (!tags.length) tags.push("RSVP only");

      return { email: r.email, name: r.full_name, subject: SUBJECT, body: lines.join("\n"), tags };
    });
}

export function remindersToCsv(reminders: Reminder[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["email", "name", "subject", "body"].join(",")];
  for (const r of reminders) {
    rows.push([esc(r.email), esc(r.name), esc(r.subject), esc(r.body)].join(","));
  }
  return rows.join("\r\n");
}
