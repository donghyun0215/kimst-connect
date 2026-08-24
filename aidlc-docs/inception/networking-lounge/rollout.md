# Networking Lounge — Rollout Kit

## URLs

| Purpose | URL |
|---|---|
| Event-day QR target | `/lounge?key=03c6cf8be1c147c19c6d196844b3334f` |
| Post-event (email gate) | `/lounge` |

`LOUNGE_ACCESS_KEY` lives in Vercel env. **Rotate it after the event** to
retire the printed QR; the email gate keeps working untouched.

## Print asset

`lounge-qr-a5.png` — A5 at 300 dpi, navy on white, error-correction H (still
scans if partly obscured). Print 2–3 copies: registration desk, lunch area,
1:1 meeting room entrance.

## Attendee reminder copy (send ~1 week before)

**EN**
> We've set up a Virtual Networking Lounge for the Open Innovation Day — an
> attendee-only wall where you can see who else is joining and stay in touch
> afterwards: https://kimst-rsvp-2026.vercel.app/lounge (enter your RSVP email).
>
> Add your LinkedIn or a contact link on the page so others can reach you —
> it takes a few seconds, no need to re-register. Only your name, organisation
> and job title are shown; emails and phone numbers never are.

**KR**
> 9월 2일 행사 참석자분들을 위한 네트워킹 라운지를 열었습니다. 어떤 분들이
> 오시는지 미리 보실 수 있고, 행사 후에도 계속 연락하실 수 있습니다:
> https://kimst-rsvp-2026.vercel.app/lounge (RSVP하신 이메일 입력)
>
> 페이지에서 링크드인이나 연락 가능한 링크를 추가해주시면 다른 참석자분들이
> 연락드릴 수 있습니다 (재등록 불필요, 몇 초면 됩니다). 이름·소속·직함만
> 표시되며 이메일과 전화번호는 공개되지 않습니다.

## Organiser notes

- Attendees without LinkedIn can use a company page or KakaoTalk open-chat
  link — the button label adapts automatically.
- Backfill: the same "Add / update my contact link" form on `/lounge` accepts
  any RSVP email, so the organiser can enter links on an attendee's behalf.
- Opt-outs: `show_in_lounge = false` in the `rsvps` table hides a card.
