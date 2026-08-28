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

// Builds one personalised reminder per RSVP in both HTML and plain text.
// HTML is what recipients see: named links instead of raw URLs, which also
// avoids Gmail's auto-linker swallowing the following line of text.

export interface Reminder {
  email: string;
  name: string;
  subject: string;
  body: string; // plain-text fallback
  html: string;
  tags: string[];
}

const SITE = "https://kimst-rsvp-2026.vercel.app";
const SUBJECT = "Your schedule — K-Marine Tech Open Innovation Day, 2 Sep";

// Change the sender block here if someone else signs the mailout.
const SIGN_NAME = "Tammy Ahn";
const SIGN_ORG = "on behalf of KIMST";

const DAY_SLOT_IDS = new Set(TIMESLOTS.map((t) => t.id));

// Personalised "Add to Google Calendar" link for the main event day.
// Each attendee's own schedule is embedded in the event description.
function gcalUrl(schedule: ScheduleItem[]): string {
  const details = [
    "Your schedule:",
    ...schedule.map((it) => `• ${it.title}`),
    "",
    `Manage your booking: ${SITE}/book`,
  ].join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "K-Marine Tech Open Innovation Day",
    dates: "20260902T100000/20260902T160000",
    ctz: "Asia/Singapore",
    location: `${EVENT_VENUE}, ${EVENT_ADDRESS}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function programTime(id: "showcase" | "lunch" | "meetups"): string {
  return PROGRAM.find((b) => b.id === id)?.time ?? "";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface ScheduleItem {
  title: string;
  detail?: string;
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
      const nuldamMeetings = mine.filter((b) => !DAY_SLOT_IDS.has(b.timeslot_id));

      const schedule: ScheduleItem[] = [];
      if (r.attend_showcase) {
        schedule.push({
          title: `Success Story Showcase — ${programTime("showcase")}`,
          detail: "Eight Korean startups present across marine technology and food technology.",
        });
      }
      if (r.attend_lunch) {
        schedule.push({
          title: `Networking Lunch — ${programTime("lunch")}`,
          detail: "Complimentary buffet with the founders and fellow attendees.",
        });
      }
      for (const m of dayMeetings) {
        const slot = TIMESLOTS.find((t) => t.id === m.timeslot_id);
        const company = getCompanyBySlug(m.company_id)?.name ?? m.company_id;
        schedule.push({ title: `1:1 Meeting with ${company} — ${slot?.time ?? ""} (${slot?.label ?? ""})` });
      }
      if (schedule.length === 0) {
        schedule.push({ title: "You're registered for the 1:1 Onsite Meetups session." });
      }

      const nuldam: ScheduleItem[] = nuldamMeetings.map((m) => {
        const info = getSlotInfo(m.timeslot_id);
        const day = (info.context ?? "").split("·")[0].trim();
        const company = getCompanyBySlug(m.company_id)?.name ?? m.company_id;
        return { title: `In-depth 1:1 with ${company} — ${day}, ${info.time}` };
      });

      // ── plain text ──
      const t: string[] = [];
      t.push(`Dear ${r.full_name},`, "");
      t.push("We're looking forward to welcoming you to the K-Marine Tech Open Innovation Day next week.", "");
      t.push("Wednesday, 2 September 2026 | 10:00 - 16:00");
      t.push(EVENT_VENUE);
      t.push(EVENT_ADDRESS);
      t.push(`Google Maps: ${EVENT_MAP_URL}`);
      t.push(`Add to Google Calendar: ${gcalUrl(schedule)}`, "");
      t.push("YOUR SCHEDULE", "-----------------------------");
      for (const it of schedule) {
        t.push(`* ${it.title}`);
        if (it.detail) t.push(`  ${it.detail}`);
      }
      if (dayMeetings.length === 0) {
        t.push("", `No 1:1 meeting booked yet - a few slots are still open: ${SITE}/book`);
      }
      if (nuldam.length) {
        t.push("", "ALSO ON YOUR CALENDAR", "-----------------------------");
        for (const it of nuldam) t.push(`* ${it.title}`);
        t.push(`  ${NULDAM_VENUE}, ${NULDAM_ADDRESS}`);
      }
      if (r.additional_attendees) {
        t.push("", `Badges will be ready for you and ${r.additional_attendees}.`);
      }
      t.push("", "NETWORKING ON THE DAY", "-----------------------------");
      t.push("We've prepared a Virtual Networking Lounge - a private, attendee-only directory of everyone in the room (name, organisation and role), so conversations can continue after the day itself.");
      t.push("The lounge opens on-site: scan the QR code at the venue on 2 September to browse who's there.", "");
      if (r.contact_url) {
        t.push("Your lounge card links to this LinkedIn profile:");
        t.push(`  ${r.contact_url}`);
        t.push("If that isn't you, or you'd prefer a different link, simply reply to this email and we'll update it.");
      } else {
        t.push("To let fellow attendees reach you, reply to this email with your LinkedIn profile URL and we'll add it to your card before the event.");
      }
      t.push("");
      t.push("Personal contact details - emails and phone numbers - are never displayed. Connections happen through LinkedIn only.", "");
      t.push(`Need to change your booking? ${SITE}/book`, "");
      t.push("See you on the 2nd.", "");
      t.push("Warm regards,", SIGN_NAME, SIGN_ORG);

      // ── html ──
      const link = (href: string, label: string) =>
        `<a href="${href}" style="color:#0766EE;text-decoration:underline;">${label}</a>`;
      const sectionTitle = (label: string) =>
        `<p style="margin:26px 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0A2163;border-bottom:2px solid #E3EAF6;padding-bottom:6px;">${label}</p>`;
      const items = (list: ScheduleItem[]) =>
        list
          .map(
            (it) =>
              `<tr><td style="padding:6px 0;vertical-align:top;width:14px;color:#0766EE;font-weight:700;">•</td>` +
              `<td style="padding:6px 0;">` +
              `<span style="font-weight:600;color:#0A2163;">${esc(it.title)}</span>` +
              (it.detail ? `<br><span style="color:#5A6B87;font-size:14px;">${esc(it.detail)}</span>` : "") +
              `</td></tr>`,
          )
          .join("");

      const h: string[] = [];
      h.push(
        `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#22314F;max-width:620px;">`,
      );
      h.push(`<p style="margin:0 0 14px;">Dear ${esc(r.full_name)},</p>`);
      h.push(
        `<p style="margin:0 0 20px;">We're looking forward to welcoming you to the <strong>K-Marine Tech Open Innovation Day</strong> next week.</p>`,
      );
      h.push(
        `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#F2F6FC;border-left:4px solid #0766EE;border-radius:6px;">` +
          `<tr><td style="padding:14px 18px;">` +
          `<div style="font-weight:700;color:#0A2163;">Wednesday, 2 September 2026 · 10:00 – 16:00</div>` +
          `<div style="margin-top:4px;color:#3D4E6E;">${esc(EVENT_VENUE)}</div>` +
          `<div style="color:#5A6B87;font-size:14px;">${esc(EVENT_ADDRESS)}</div>` +
          `<div style="margin-top:8px;font-size:14px;">${link(EVENT_MAP_URL, "View on Google Maps →")}</div>` +
          `<div style="margin-top:12px;">` +
          `<a href="${gcalUrl(schedule).replace(/&/g, "&amp;")}" style="display:inline-block;background:#0766EE;color:#FFFFFF;font-weight:600;font-size:14px;padding:9px 16px;border-radius:6px;text-decoration:none;">Add to Google Calendar →</a>` +
          `</div>` +
          `</td></tr></table>`,
      );
      h.push(sectionTitle("Your schedule"));
      h.push(`<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${items(schedule)}</table>`);
      if (dayMeetings.length === 0) {
        h.push(
          `<p style="margin:14px 0 0;padding:12px 14px;background:#FFF8E7;border-radius:6px;font-size:14px;">` +
            `You haven't booked a 1:1 meeting with the startups yet — a few slots are still open. ` +
            `${link(`${SITE}/book`, "Book a 1:1 meeting →")}</p>`,
        );
      }
      if (nuldam.length) {
        h.push(sectionTitle("Also on your calendar"));
        h.push(`<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${items(nuldam)}</table>`);
        h.push(
          `<p style="margin:8px 0 0;color:#5A6B87;font-size:14px;">${esc(NULDAM_VENUE)}, ${esc(NULDAM_ADDRESS)}</p>`,
        );
      }
      if (r.additional_attendees) {
        h.push(
          `<p style="margin:16px 0 0;font-size:14px;">Badges will be ready for you and <strong>${esc(r.additional_attendees)}</strong>.</p>`,
        );
      }
      h.push(sectionTitle("Networking on the day"));
      h.push(
        `<p style="margin:0 0 12px;">We've prepared a <strong>Virtual Networking Lounge</strong> — a private, attendee-only directory of everyone in the room (name, organisation and role), so conversations can continue after the day itself.</p>`,
      );
      h.push(
        `<p style="margin:0 0 14px;">The lounge opens <strong>on-site</strong>: scan the QR code at the venue on 2 September to browse who's there.</p>`,
      );
      if (r.contact_url) {
        h.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#F2F6FC;border-radius:6px;"><tr><td style="padding:12px 16px;font-size:14px;">` +
            `Your lounge card links to this LinkedIn profile:<br>` +
            `${link(r.contact_url, esc(r.contact_url))}<br>` +
            `<span style="color:#5A6B87;">If that isn't you, or you'd prefer a different link, simply <strong>reply to this email</strong> and we'll update it.</span>` +
            `</td></tr></table>`,
        );
      } else {
        h.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FFF8E7;border-radius:6px;"><tr><td style="padding:12px 16px;font-size:14px;">` +
            `To let fellow attendees reach you, <strong>reply to this email with your LinkedIn profile URL</strong> and we'll add it to your card before the event.` +
            `</td></tr></table>`,
        );
      }
      h.push(
        `<p style="margin:14px 0 18px;font-size:13px;color:#5A6B87;">Personal contact details — emails and phone numbers — are never displayed. Connections happen through LinkedIn only.</p>`,
      );
      h.push(
        `<p style="margin:0 0 22px;font-size:14px;">Need to change your booking? ${link(`${SITE}/book`, "Manage it here")}.</p>`,
      );
      h.push(`<p style="margin:0 0 18px;">See you on the 2nd.</p>`);
      h.push(
        `<p style="margin:0;padding-top:16px;border-top:1px solid #E3EAF6;font-size:14px;color:#5A6B87;">Warm regards,<br>` +
          `<strong style="color:#0A2163;">${SIGN_NAME}</strong><br>${SIGN_ORG}</p>`,
      );
      h.push(`</div>`);

      const tags: string[] = [];
      if (r.attend_showcase) tags.push("Showcase");
      if (r.attend_lunch) tags.push("Lunch");
      if (dayMeetings.length) tags.push(`${dayMeetings.length} meeting${dayMeetings.length > 1 ? "s" : ""}`);
      if (nuldam.length) tags.push("Nuldam");
      if (!tags.length) tags.push("RSVP only");

      return { email: r.email, name: r.full_name, subject: SUBJECT, body: t.join("\n"), html: h.join(""), tags };
    });
}

export function remindersToCsv(reminders: Reminder[]): string {
  const esc2 = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["email", "name", "subject", "body", "html"].join(",")];
  for (const r of reminders) {
    rows.push([esc2(r.email), esc2(r.name), esc2(r.subject), esc2(r.body), esc2(r.html)].join(","));
  }
  return rows.join("\r\n");
}
