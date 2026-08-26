<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### Session continuity and architecture authority gate

`AGENTS.md` is the enforcement gateway, not product authority. After opening it,
every Codex/agent session must follow this canonical LOGIN/RESUME order:

`AGENTS.md` → `CONTEXT_START_HERE.md` → `continuity/ACTIVE_HANDOFF.md` → `FOUNDER_PRODUCT_CONSTITUTION.md` → `architecture/REAIDEA_FLIGHT_PLAN.md` → relevant Page Blueprint and Visual Authority → `CURRENT_CONSTRUCTION_STATE.md` → active Build Contract

1. Read `CONTEXT_START_HERE.md`.
2. Read `continuity/ACTIVE_HANDOFF.md`.
3. Read `FOUNDER_PRODUCT_CONSTITUTION.md`.
4. Read `architecture/REAIDEA_FLIGHT_PLAN.md`.
5. Read the relevant page entry in `architecture/PAGE_BLUEPRINT_REGISTER.md`, the matching entry in `architecture/VISUAL_AUTHORITY_REGISTER.md`, and the registered Visual Page Blueprint for the exact screen/state.
6. Read `CURRENT_CONSTRUCTION_STATE.md`.
7. Read the founder-approved active Build Contract named by the construction state.

After that canonical sequence, read the relevant lane in
`architecture/BUILD_LANES.md`, applicable supersession/decision records and
`SECURITY_ENGINEERING_STANDARD.md`. Then verify branch, local HEAD, configured
upstream, ahead/behind without fetching, worktree and index. Create
`continuity/daily/YYYY-MM-DD/` from the continuity templates if today's folder
is absent.

If no founder-approved active Build Contract or required approved Visual Page Blueprint exists, remain read-only. Before modifying Next.js code, also read this repository's relevant guide under `node_modules/next/dist/docs/`.

At login/resume, give the founder exactly one short six-line starting summary:

1. Checkpoint.
2. Active lane.
3. Baseline HEAD, upstream and parity.
4. Worktree and index.
5. Protected invariants/paths.
6. Next authorized action or founder decision required.

Before modifying code, the agent must state:

- active lane;
- checkpoint and baseline SHA;
- permitted file boundary;
- protected behaviour;
- acceptance test;
- rollback point.

Only one build lane may be active. Cross-lane implementation requires a founder-approved architecture decision that defines the combined boundary and rollback.

The agent must also:

1. Treat the founder-accepted Constitution as product authority and the Flight Plan as the shared construction plan.
2. Treat `CURRENT_CONSTRUCTION_STATE.md` and handovers as implementation evidence, not product authority.
3. Preserve historical journals, blueprints and superseded documents as evidence rather than current instructions.
4. Follow `architecture/AGENT_HANDOVER_STANDARD.md` for every handover.
5. Explain provider, storage, security and cost implications before a production change.
6. Never treat “proceed,” “try this,” “fix it,” visual acceptance or implementation convenience as authorization to change product direction.
7. Stop and report conflicts among founder direction, security controls, architecture authority, visual authority, construction state and the requested implementation.
8. Do not modify `FOUNDER_PRODUCT_DIRECTION.md` unless the founder explicitly states `APPROVE FOUNDER PRODUCT DIRECTION UPDATE`.

### During work

- Record only decisions, accepted evidence, problems and resolutions in today's continuity records.
- Reference existing architecture, construction and evidence records instead of repeating their contents.
- Never use chat history as product, architecture, visual or acceptance authority.
- Never change production presentation without a founder-approved Visual Page Blueprint and exact screen/data/interaction Build Contract.
- Work on one screen/state and one active lane at a time unless an accepted architecture decision explicitly authorizes otherwise.

### Sign-off

Before ending a working day or handing off:

1. Update today's `DAILY_LOG.md` and `EVIDENCE_INDEX.md`.
2. Replace `continuity/ACTIVE_HANDOFF.md` with current truth.
3. Update `continuity/DAILY_INDEX.md`.
4. Record branch, local HEAD, remote-tracking SHA, ahead/behind and the GitHub repository reference.
5. Provide the short `REV HANDOFF` defined by `architecture/AGENT_HANDOVER_STANDARD.md`.
6. Commit or push daily records only with founder authorization or an accepted checkpoint.
7. Never stage unrelated, rejected or unfinished work.

### Mandatory security engineering guard

Before material architecture or implementation work, read and comply with
`SECURITY_ENGINEERING_STANDARD.md`. Perform a lightweight threat assessment,
escalate unresolved HIGH or CRITICAL risks, and add proportionate negative
security tests. Do not claim a change is production-ready or security-verified
without evidence. Implementation reports must state security posture, threats
considered, controls, security tests, open risks, residual risk, and production
requirements.
