// Post-event thank-you mailout (4 Sep, Tammy's brief). ONE message for
// everyone — explicitly no segmentation ("그냥 나누지 말고"), so attendees
// and no-shows read the same three beats: thank you for coming; if you
// couldn't make it, the startups live at the site and we'll connect you
// online on request; we'll keep sharing how these startups grow. Same CSV
// columns as the reminder mailout (email,name,subject,body,html) so
// Tammy's existing Apps Script sends it unchanged.

import type { AdminRsvp } from "@/lib/booking.server";

const SITE = "https://kimst-rsvp-2026.vercel.app";
const STARTUPS_URL = `${SITE}/#startups`;

const SUBJECT = "Thank you for joining us — K-Marine Tech Open Innovation Day";

const SIGN_NAME = "Tammy Ahn";
const SIGN_ORG = "on behalf of KIMST";

export interface ThankYouEmail {
  email: string;
  name: string;
  subject: string;
  body: string;
  html: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildThankYous(rsvps: AdminRsvp[]): ThankYouEmail[] {
  return rsvps.map((r) => {
    const first = r.full_name.trim();

    // ── plain text ──
    const t: string[] = [];
    t.push(`Dear ${first},`, "");
    t.push(
      "Thank you so much for being part of the K-Marine Tech Open Innovation Day on 2 September. It was a pleasure to welcome you at Suntec, and we hope the showcase, the conversations over lunch, and the 1:1 meetings were as energising for you as they were for us.",
      "",
    );
    t.push(
      `If you couldn't make it on the day — or would like another look — all eight startups are on our website with their stories and one-pagers: ${STARTUPS_URL}`,
      "",
    );
    t.push(
      "If you'd like to be connected with any of the teams online, just reply to this email and we'll gladly make the introduction.",
      "",
    );
    t.push(
      "This is only the beginning: we'll keep you posted as these startups grow — new milestones, partnerships, and their journey in Singapore and beyond.",
      "",
    );
    t.push("With gratitude,", SIGN_NAME, SIGN_ORG);
    const body = t.join("\n");

    // ── html ──
    const h: string[] = [];
    h.push(
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px 24px;color:#243154;font-size:15px;line-height:1.65;">`,
    );
    h.push(`<p style="margin:0 0 20px;">Dear ${esc(first)},</p>`);
    h.push(
      `<p style="margin:0 0 20px;">Thank you so much for being part of the <strong>K-Marine Tech Open Innovation Day</strong> on 2 September. It was a pleasure to welcome you at Suntec, and we hope the showcase, the conversations over lunch, and the 1:1 meetings were as energising for you as they were for us.</p>`,
    );
    h.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;"><tr><td style="background:#F4F7FC;border-radius:10px;padding:16px 18px;">` +
        `<p style="margin:0 0 10px;">If you couldn't make it on the day — or would like another look — all eight startups are on our website with their stories and one-pagers.</p>` +
        `<a href="${STARTUPS_URL}" style="display:inline-block;background:#0766EE;color:#FFFFFF;font-weight:600;font-size:14px;padding:9px 16px;border-radius:6px;text-decoration:none;">Meet the startups →</a>` +
        `</td></tr></table>`,
    );
    h.push(
      `<p style="margin:0 0 20px;">If you'd like to be connected with any of the teams online, just <strong>reply to this email</strong> and we'll gladly make the introduction.</p>`,
    );
    h.push(
      `<p style="margin:0 0 20px;">This is only the beginning: we'll keep you posted as these startups grow — new milestones, partnerships, and their journey in Singapore and beyond.</p>`,
    );
    h.push(
      `<p style="margin:0;padding-top:16px;border-top:1px solid #E3EAF6;font-size:14px;color:#5A6B87;">With gratitude,<br>` +
        `<strong style="color:#0A2163;">${SIGN_NAME}</strong><br>${SIGN_ORG}</p>`,
    );
    h.push(`</div>`);
    const html = h.join("");

    return { email: r.email, name: r.full_name, subject: SUBJECT, body, html };
  });
}

export function thankYousToCsv(mails: ThankYouEmail[]): string {
  const escCsv = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = "email,name,subject,body,html";
  const lines = mails.map((m) => [m.email, m.name, m.subject, m.body, m.html].map(escCsv).join(","));
  return header + "\r\n" + lines.join("\r\n");
}
