# reAIdea Session Continuity Routine

Purpose: Keep product direction stable when a ChatGPT or Codex window becomes slow, long or unreliable.

## The governing rule

**The repository and Founder Product Truth are project memory. Chat windows are temporary workrooms.**

Never rely on a narrative chat handover as the sole authority.

## Permanent records

Maintain these founder-approved documents:

1. `reAIdea_Founder_Product_Truth_2026-08-22.md`
   - Product promise, golden journeys, bench contracts and non-negotiable rules.
2. `CURRENT_CONSTRUCTION_STATE.md`
   - Exact Git checkpoint and current implementation state only.
3. `DECISION_LOG.md`
   - Short record of accepted product decisions and rejected directions.
4. `NEXT_BUILD_CONTRACT.md`
   - One approved, bounded change at a time.
5. `ACCEPTANCE_EVIDENCE.md`
   - What was tested, screenshots, results and deferred risks.

The Product Truth overrides construction notes when they conflict. Construction notes may report what exists; they may not redefine what the product should be.

## Starting every new chat

Use this message:

> REV, continue reAIdea from the attached Founder Product Truth and current construction checkpoint. Read both before advising or changing anything. The Founder Product Truth is authoritative for the inventor and investor journeys. Verify the actual Git checkpoint read-only. Do not code until you provide a plain-language Build Contract and I approve it.

Attach or cite:

- the latest Founder Product Truth;
- the latest construction checkpoint;
- the currently approved Build Contract, if one exists;
- only the screenshots directly relevant to the next decision.

## Before every build

REV must provide a Build Contract containing:

- Problem being solved.
- Inventor journey requirement.
- Investor journey requirement.
- Before/after behaviour.
- Visual storyboard when applicable.
- Exact file boundary.
- Protected behaviour.
- Provider/storage/cost consequences.
- Acceptance journey.
- Failure and rollback conditions.

The founder approves the contract before Codex receives implementation instructions.

## During construction

- One bounded outcome per build.
- No unrelated cleanup.
- No silent product decisions.
- No commit or push before human acceptance.
- Preserve screenshots of meaningful before/after states.
- Stop when evidence contradicts the Build Contract.

## Closing a session

Use this message:

> REV, close this session. Update the construction checkpoint and decision log without changing accepted production code. Record what was accepted, rejected, untested and deferred; exact Git state; provider usage; server state; and the next safe step. Produce a short new-window opening message. Do not commit or push unless separately authorised.

The closeout must record:

- branch, HEAD, parent and upstream relationship;
- clean/modified/staged/untracked state;
- accepted behaviour;
- rejected experiments;
- automated and browser verification;
- provider operations and cost-sensitive actions;
- server and browser-profile status;
- exact next safe step.

## When the chat begins to lag

Do not wait until the window becomes unusable.

At the first signs of material lag:

1. Stop new implementation work.
2. Close the current decision or clearly mark it incomplete.
3. Produce the session closeout.
4. Start a fresh chat using the opening message above.
5. Treat the new chat's first task as read-only alignment, not construction.

## Founder checkpoint questions

Before accepting any build, ask:

1. Does this make the inventor do less work or more work?
2. Does useful value appear earlier or later?
3. Does REV carry existing understanding forward?
4. Does this improve the investor's evidence or merely add presentation?
5. Are assumptions and sources represented honestly?
6. Can I explain the change in one sentence?
7. Does it match the Founder Product Truth?

If any answer is unclear, the build pauses.

## Simple versioning convention

Use dated versions for the founder record:

`reAIdea_Founder_Product_Truth_YYYY-MM-DD.md`

Never overwrite an accepted direction without recording the decision that changed it. Preserve rejected alternatives in the Decision Log rather than leaving them in the active specification.

