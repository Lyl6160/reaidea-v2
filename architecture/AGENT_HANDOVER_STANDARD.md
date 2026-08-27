# reAIdea Agent Handover Standard

**Status:** FOUNDER APPROVED — mandatory continuity standard

## Purpose

A handover must let another agent or founder continue without reconstructing authority from chat history. It reports evidence; it does not create approval.

## Required document read order

`AGENTS.md` → `CONTEXT_START_HERE.md` → `CURRENT_CONSTRUCTION_STATE.md` → Constitution and Security Standard → Founder Control System → exact Visual Authority → accepted architecture/runtime and active Build Contract → `continuity/ACTIVE_HANDOFF.md` → historical evidence only as needed

The `CURRENT WORK` block is the sole live reference, phase, iteration and stop gate. The handoff copies it and cannot change it. If the active Build Contract, visual authority, exact founder authorization or path boundary is absent or conflicting, work remains read-only.

Before action, every agent accounts for: current reference/phase/iteration; exact founder authorization; branch/HEAD/upstream/index; tracked/untracked paths; required starting state; allowed files; prohibited files/protected foundations; visual references/hashes; tests/founder walkthrough; and stop conditions.

## Mandatory fields

Every future handover states:

1. **Checkpoint** — exact current reference, phase, iteration and controlled status.
2. **Active lane** — one Lane 0–7, or the accepted ADR authorizing cross-lane work.
3. **Baseline SHA** — full local commit and configured upstream relationship without fetching unless authorized.
4. **Completed work** — observed implementation or documentation outcome; distinguish founder-accepted, technically verified and merely implemented.
5. **Changed paths** — staged, unstaged and untracked paths separately; identify authorized boundary.
6. **Protected invariants** — Project truth, safety, provider, persistence, one-Canvas, accessibility or other contracts that remain unchanged.
7. **Checks** — exact commands/results, browser/provider counts and any deferred or environmental failure.
8. **Founder decisions** — unresolved choices; never convert silence or a screenshot into approval.
9. **Next action** — one bounded action, exact founder gate, required starting state and stop conditions.
10. **Rollback point** — commit or preserved file hashes that return to the last accepted state without destroying unrelated work.

## Required handover form

```text
REV HANDOFF
Checkpoint:
Founder authorization:
Active lane:
Baseline SHA / upstream:
Required starting state:
Completed work:
Changed paths:
Allowed / prohibited files:
Protected invariants:
Visual references / hashes:
Checks:
Founder decisions:
Next action:
Stop conditions:
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
