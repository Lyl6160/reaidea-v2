# reAIdea Agent Handover Standard

**Status:** FOUNDER APPROVED — mandatory continuity standard

## Purpose

A handover must let another agent or founder continue without reconstructing authority from chat history. It reports evidence; it does not create approval.

## Required document read order

`AGENTS.md` → `CONTEXT_START_HERE.md` → `continuity/ACTIVE_HANDOFF.md` → `FOUNDER_PRODUCT_CONSTITUTION.md` → `architecture/REAIDEA_FLIGHT_PLAN.md` → relevant Page Blueprint and Visual Authority → `CURRENT_CONSTRUCTION_STATE.md` → active Build Contract

After reading `AGENTS.md`, every coding agent reads completely and in order:

1. `CONTEXT_START_HERE.md`
2. `continuity/ACTIVE_HANDOFF.md`
3. `FOUNDER_PRODUCT_CONSTITUTION.md`
4. `architecture/REAIDEA_FLIGHT_PLAN.md`
5. The relevant page entry, matching visual-authority entry and registered Visual Page Blueprint
6. `CURRENT_CONSTRUCTION_STATE.md`
7. The founder-approved active Build Contract named by the construction state

Relevant lane, supersession/decision and security records follow this canonical sequence.

If the active Build Contract is absent or not founder-approved, work remains read-only.

## Mandatory fields

Every future handover states:

1. **Checkpoint** — exact Build/hold point and acceptance state.
2. **Active lane** — one Lane 0–7, or the accepted ADR authorizing cross-lane work.
3. **Baseline SHA** — full local commit and configured upstream relationship without fetching unless authorized.
4. **Completed work** — observed implementation or documentation outcome; distinguish founder-accepted, technically verified and merely implemented.
5. **Changed paths** — staged, unstaged and untracked paths separately; identify authorized boundary.
6. **Protected invariants** — Project truth, safety, provider, persistence, one-Canvas, accessibility or other contracts that remain unchanged.
7. **Checks** — exact commands/results, browser/provider counts and any deferred or environmental failure.
8. **Founder decisions** — unresolved choices; never convert silence or a screenshot into approval.
9. **Next action** — one bounded action and its required authorization.
10. **Rollback point** — commit or preserved file hashes that return to the last accepted state without destroying unrelated work.

## Required handover form

```text
REV HANDOFF
Checkpoint:
Active lane:
Baseline SHA / upstream:
Completed work:
Changed paths:
Protected invariants:
Checks:
Founder decisions:
Next action:
Rollback point:
Security posture: PASS / PASS WITH RISKS / NOT READY
```

## Evidence rules

- Use full commit hashes for checkpointing and SHA-256 for protected assets or uncommitted byte preservation.
- Report provider and API operations explicitly; zero is a measured claim only when evidenced.
- Separate automated checks, provider-free browser evidence, controlled live-provider evidence and founder visual acceptance.
- Never include credentials, prompts containing confidential invention content, raw provider payloads or secret-bearing errors.
- Do not say clean when authorized uncommitted work exists. State worktree and index separately.
- Do not say accepted when review is pending or limited to functional plumbing.
- Record environmental blockers truthfully; do not change unrelated source merely to make a check green.

## Start-of-work declaration

Before modifying code, the agent states:

- active lane;
- checkpoint and baseline;
- permitted file boundary;
- protected behavior;
- acceptance test;
- rollback point.

If no accepted active Build Contract exists, the agent remains read-only.

## Closing sequence

1. Reconfirm path boundary and protected hashes.
2. Run proportionate static, focused, security and visual checks.
3. Report failures before staging.
4. Obtain required founder acceptance.
5. Stage only explicit paths when authorized.
6. Commit and push only when separately authorized.
7. Verify remote/local state and issue the final handover.

Handover records are construction evidence beneath the Constitution and Flight Plan. They cannot supersede either document.
