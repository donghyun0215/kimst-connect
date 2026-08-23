# ADR-000 — Adopt AI-DLC for this repository

- **Status:** Accepted
- **Date:** 2026-08-23
- **Deciders:** Donghyun Kim (approver)

## Context

The site was built and is being maintained through AI-assisted sessions. That
has been fast, but it has produced recurring costs:

- Context is rebuilt from scratch each session; decisions made weeks ago are
  re-derived or contradicted.
- No requirements, design, or decision artefacts exist outside chat history.
- Changes are not traceable — there is no written link from "the organiser asked
  for X" to the commit that delivered it.
- One production incident (I1) came directly from a change being made without a
  written plan that would have surfaced its ordering dependency.

The site is live and taking real bookings from partners and investors, so the
cost of a bad change is now external, not just internal.

## Decision

Adopt the AI-DLC methodology (AWS, `github.com/awslabs/aidlc-workflows`) for
work on this repository, with these operating rules:

1. **Plan → Approve → Execute.** Any non-trivial change is planned in writing
   and executed only after explicit human approval.
2. **Brownfield first.** The existing system is reverse-engineered into static
   and dynamic models before further modification. *(This ADR ships with that
   pass complete.)*
3. **`aidlc-docs/` is the persistent memory.** Requirements, designs, decisions,
   and plans are committed here and read at the start of each session.
4. **Depth scales with the task.** Copy tweaks and single-constant edits proceed
   directly; anything touching the schema, the booking invariants, or a new
   subsystem runs the fuller cycle.
5. **Human is the approver, not the author.** The AI proposes plans and
   decomposition; the human validates at decision points. That validation is the
   error-catching mechanism.

## Consequences

**Gained:** durable context across sessions; a written trail from request to
commit; a checkpoint that would have caught I1; onboarding material for anyone
else touching the repo.

**Cost:** an approval round trip before implementation, and documents to keep
current. Rule 4 exists to keep that cost proportional — the overhead is not
worth paying to change a button label.

**Risk:** documentation drifting from code. Mitigated by keeping artefacts small
and updating them within the change that invalidates them, rather than in a
separate cleanup pass.
