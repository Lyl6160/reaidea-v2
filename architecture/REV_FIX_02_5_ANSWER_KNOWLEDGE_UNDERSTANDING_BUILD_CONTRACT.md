# REV-FIX-02.5 — Answer, Knowledge and Understanding Build Contract

**Status:** FOUNDER APPROVED CONTRACT — QUEUED; PHASE 2 BUILD LOCKED
**Approved:** 28 August 2026
**Founder authorization:** `APPROVE REV-FIX-02.5 CONTRACT`
**Reference:** `REV-FIX-02.5 — Answer, knowledge and understanding`
**Phase / iteration:** Future queued contract; Stage 1A and Stage 1B are complete, but they are not sufficient entry conditions. The remaining `REV-FIX-02.4` visual-recovery stages must be completed and documented before separate founder authorization can make this contract current.
**Active lane:** NONE — future Lane 2 boundary only; Lane 0 governance/checkpoint control remains current
**Active Build Contract:** NONE; this queued contract is not active. Stage 1C remains locked and cannot be bypassed to activate `REV-FIX-02.5`.
**Baseline:** `503d1389bdec5e7cb4c3b94560e009189896faa3`
**Rollback point:** `503d1389bdec5e7cb4c3b94560e009189896faa3`; preserve authorized continuity work and unrelated files

## Outcome

Implement and verify one bounded Home understanding step after the accepted `ASK REV` handoff. REV presents what it understands, asks one smallest useful plain-English question, safety-checks the proposed answer before recording it, persists exactly one accepted fact to the same Project, verifies reload, presents one truthful blue-to-orange knowledge pulse and asks another question only when evidence genuinely requires it.

This contract also corrects the identified read-model defect so active Home knowledge values and their source identity can reach the relevant future Workshop stand contexts. It does not enter or visually change the Workshop.

## Required starting state

Only after the remaining `REV-FIX-02.4` visual-recovery stages are completed, documented and explicitly accepted may a future walkthrough begin from a new isolated localhost origin and reach:

- exactly one canonical Project created only after a CLEAR creation-intent decision;
- the exact inventor description preserved once in `originalObservation`;
- one active persisted Home understanding question;
- no accepted answer to that question;
- zero Concept, ConceptGeometry, generated invention or Workshop navigation;
- zero provider operation.

No fixture, seeded invention, browser-storage edit, provider call or direct Workshop entry may create this starting state.

## Exact visual authority

- Protected Homepage entry: `visual-authority/home/VPB-HOME-006-approved-homepage-entry-2026-08-27.png`, SHA-256 `122F5579FC5A34D219C42CC4C517C2F93C1543A3D7269A73415C3BDEBFA48B1F`.
- Understanding conversation: `visual-authority/home/VPB-HOME-002-ai-understanding-approved-2026-08-26.png`, SHA-256 `874EEEE36E6DD4C784898A3A026C90D8CFDD7B107C762551D13CA16898C5C29D`.
- Knowledge pulse: `visual-authority/home/VPB-HOME-003-knowledge-pulse-approved-2026-08-26.png`, SHA-256 `7C4B12975E7EB228C23B5E7A4CD4143A8DCCCF271C29D9371FAD40B66995F795`.
- Journey authority: `visual-authority/journey/VPB-JOURNEY-002-home-ai-creation-handover-approved-2026-08-26.pdf`, SHA-256 `BF241741760BBCD4B98F610D99D72331E55D390630B42EFDEB51DB8F7C7495D3`.
- Founder-rejected moon panorama — prohibited historical reference only, never protected, approved, current authority, fallback, runtime input or Stage 1 input: `public/images/reaidea-home-panoramic-scene-candidate-corrected-2026-08-24.png`, SHA-256 `F5DC0F8BCA331B3137E04F155AEDF9A94CCD7F2A5F1F4062B15950EB02B496E2`.
- Protected REV identity: `B385D98AAB0038940512D4780EA72CFD89CDB0921C10F651BA8BD5067DC49070`.

Flattened invention text, sample answers, meter state, Returning Project control and sample imagery are illustrative only. Runtime content must come from the active Project.

## Controlled interaction

1. After accepted `ASK REV`, the three origin-intent cards leave the active console and the integrated `WHAT REV UNDERSTANDS` state appears without redesigning the approved Home architecture.
2. REV displays only source-distinguished information already captured from the Project and one active useful question.
3. The inventor may choose a bounded answer, answer in their own words, or use `I'M NOT SURE / LET REV RECOMMEND` only when the recommendation has recorded Project support and remains a reversible REV assumption.
4. Before any proposed answer is recorded, REV repeats the deterministic creation-intent safety boundary using the existing Project description plus the proposed answer.
5. CLEAR may continue. HOLD asks one smallest safety-purpose question. BLOCK gives the safe refusal and permitted alternatives. Unavailable fails closed. HOLD, BLOCK and unavailable record no answer, create no pulse and perform no provider operation.
6. A CLEAR answer is recorded exactly once to the same Project, persisted, reloaded and verified before the orange knowledge presentation becomes eligible.
7. Blue represents active communication. Orange represents only the newly secured answer. No percentage, countdown, confidence, feasibility or random decorative advancement is permitted.
8. A durable presentation claim prevents the same orange pulse from replaying after refresh.
9. REV asks another question only when active evidence coverage has a genuine remaining gap. Accepted information is never requested again.
10. If this answer completes the `.5` evidence step, the UI remains in a truthful secured state. `READY TO CREATE 3D`, Creation Theatre, Concept generation and Workshop handoff remain controlled by `.6` and later references.

## Canonical Home-to-Workshop knowledge bridge

- The Workshop read model must consume `deriveActiveHomeKnowledge(project)` and the actual `HomeKnowledgeRecord.value`; it must not substitute a generic timeline description for the inventor's answer.
- The knowledge event/source identity, category, authority, supporting source IDs and reversible-assumption label remain traceable.
- Superseded Home knowledge is excluded.
- One active fact may inform every relevant future stand context without creating a bench-local truth store or asking the inventor again.
- Project isolation is mandatory: no fact or source from another Project may enter the read model.
- Workshop components, visual presentation, navigation and Canvas ownership remain unchanged.

## Exact Phase 2 implementation boundary

Production presentation and orchestration:

- `app/page.tsx`
- `app/components/HomeVisualShell.tsx`
- `app/components/HomeVisualShell.module.css`
- `app/components/HomeRevUnderstanding.tsx`
- `app/components/HomeRevUnderstanding.module.css`
- `app/lib/workshop/revWorkingUnderstanding.ts`

Focused tests:

- `app/page.test.mjs`
- `app/components/HomeRevUnderstanding.test.mjs`
- `app/lib/workshop/revWorkingUnderstanding.test.ts`
- `app/api/creation-intent/route.test.ts`

Contract, registers and continuity:

- `CURRENT_CONSTRUCTION_STATE.md`
- `architecture/BUILD_LANES.md`
- `architecture/PAGE_BLUEPRINT_REGISTER.md`
- `architecture/REAIDEA_FLIGHT_PLAN.md`
- `architecture/REV_FIX_02_5_ANSWER_KNOWLEDGE_UNDERSTANDING_BUILD_CONTRACT.md`
- `architecture/SUPERSESSION_REGISTER.md`
- `architecture/VISUAL_AUTHORITY_REGISTER.md`
- `visual-authority/SCREEN_INDEX.md`
- `continuity/ACTIVE_HANDOFF.md`
- `continuity/DAILY_INDEX.md`
- `continuity/daily/2026-08-28/DAILY_LOG.md`
- `continuity/daily/2026-08-28/EVIDENCE_INDEX.md`

Every other repository path is prohibited. If implementation requires a Project schema, storage engine, provider, API route, Workshop component, public asset, dependency, configuration or other path change, stop for a revised founder-approved contract.

## Protected behavior

- Exact accepted `REV-FIX-02.1–02.3` behavior, the protected Stage 1A–1B visual references, and only the later `REV-FIX-02.4` behavior that receives explicit founder acceptance before this contract is activated.
- One canonical Project; no second memory, Project, evidence store or bench truth.
- Safety before harmful answer persistence and before any later provider work.
- Existing `HomeKnowledgeRecord`, persistence, reload, source, supersession, recommendation and presentation-claim semantics.
- No provider, Concept, geometry, Creation Theatre or Workshop operation in `.5`.
- No automatic navigation, hidden retry, duplicate answer or duplicate Project.
- Founder-approved clean environment, independent REV identity/placement, opening composition references and protected assets remain byte-identical; the rejected moon panorama remains prohibited.
- Accessible labels, keyboard and focus behavior, non-colour status meaning and reduced-motion equivalent.
- One Workshop `Prototype3DViewer` mount and one Canvas remain untouched.

## Provider, storage, security and cost

- **Provider:** disabled and prohibited for this contract; provider operation count must remain zero.
- **Storage:** prototype browser persistence retains the same Project and one accepted fact. It is not a production authorization boundary.
- **Security:** the answer is confidential untrusted input. It must pass the deterministic safety boundary before persistence. HOLD/BLOCK/unavailable fail closed. Safe errors do not echo confidential content or policy internals.
- **Cost:** zero provider cost and no automatic or hidden retry.
- **Open production risks:** identity, Project object authorization, encrypted server persistence, rate limiting, abuse controls, secure deletion and broader semantic/multilingual hazardous-intent coverage remain unresolved.

## Acceptance evidence

Focused verification must prove:

1. CLEAR records exactly one answer to the active question and the same Project.
2. Safety assessment occurs before `recordHomeUnderstandingAnswer` and before persistence.
3. HOLD, BLOCK and unavailable add no knowledge event, presentation claim, pulse, provider attempt, Concept or geometry.
4. The accepted answer survives persistence and reload.
5. The orange pulse becomes eligible only after verified persistence and cannot replay after refresh.
6. A duplicate action cannot create a second answer or Project.
7. Another question appears only for a real unresolved evidence category and never repeats accepted information.
8. Active Home knowledge values and source IDs reach each relevant Workshop read context; superseded values do not; two Projects remain isolated.
9. REV recommendations remain labelled, reversible and source-supported.
10. No `READY TO CREATE 3D`, Creation Theatre, Concept generation, geometry or Workshop navigation is introduced by this reference.
11. Existing provider-free Home understanding, Project storage, creation-intent safety, Home orchestration and one-Canvas protection tests remain passing.
12. Lint, TypeScript no-emit, production build and `git diff --check` pass.

Founder walkthrough must use the real application from a new isolated origin at desktop, `1100 × 800` and `390 × 844`. It reviews one safe answer, one HOLD/BLOCK example without harmful procedural detail, refresh/no-replay, keyboard/focus and reduced motion. Stop at `TECHNICALLY VERIFIED — AWAITING FOUNDER VISUAL WALKTHROUGH`.

## Stop conditions

Stop on any need to call a provider, change a prohibited path, enter Workshop, create a Concept or geometry, expose harmful procedural content, weaken safety, alter accepted `.1–.3` or later founder-accepted `.4` behavior, replay a pulse, lose source identity, cross Project boundaries or begin `.6`.

## Phase gate

This founder-approved contract remains queued and inactive. Stage 1A and Stage 1B are founder approved and documented, but they do not complete the `REV-FIX-02.4` visual recovery or make `.5` current. Phase 2 implementation remains locked until the remaining `.4` recovery stages are completed and documented, the Founder Build Board makes `.5` current and the founder explicitly states:

`APPROVE REV-FIX-02.5 PHASE 2 BUILD`
