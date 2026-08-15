# CONSTRUCTION_HOLD_POINTS

## Purpose

These are the inspection points between construction stages.

A hold point means: stop, inspect, test, record, then proceed.

## HP-24.2 — Validation Workshop

**Scope:** Integrate validation execution into the Living Workshop.

### Entry condition

- Current repository snapshot captured.
- Governance documents present.
- Existing validation domain inspected.

### Inspection

- No duplicate validation engine.
- Existing validation execution logic remains authoritative.
- UI only gathers/initiates work and displays state.
- Project persistence remains the single source of truth.

### Acceptance

Run `ACCEPTANCE_TESTS.md` AT-001 through AT-010 as applicable.

### Sign-off

Only after the home-PC acceptance journey passes may this hold point become VERIFIED.

## HP-24.2-POST

After verification:

1. Update `CURRENT_CONSTRUCTION_STATE.md`.
2. Record any deviations or known warnings.
3. Commit the verified checkpoint.
4. Tag the verified build.
5. Only then begin the next unrelated construction stage.

## Rule

No bot may bypass a hold point by declaring a build "good enough" from compilation alone.

## HP-24.3 - Validation Evidence Assessment

**Scope:** Correct the validation evidence-assessment defect discovered during live Build 24.2 acceptance.

### Entry condition

- Build 24.2 remains protected at `c7d70d0`.
- Branch: `sprint006-build24-3-validation-reasoning`.
- The live acceptance defect has been reproduced.
- Exact current `validationExecution.ts` has been inspected.

### Defect under investigation

Evidence explicitly stating that measured evidence does not exist was classified as **Supported by evidence**.

The current assessment logic can match the positive signal `measured` inside a negated statement.

### Construction constraint

Correct the assessment behaviour without creating a second validation engine or redesigning the validation architecture.

### Acceptance

- Absent or not-yet-measured evidence -> **inconclusive**.
- Evidence requiring further testing -> **inconclusive**.
- Genuine supporting evidence -> **confirmed**.
- Genuine contradictory evidence -> **challenged**.
- Evidence that changes understanding without confirming or challenging -> **refined**.
- Conflicting or limiting language must not manufacture confirmation.

### Sign-off

### Sign-off

HP-24.3 - VERIFIED

**Inspection date:** 2026-08-12

The Build 24.3 defect correction passed the demonstrated regression acceptance, static quality gates, and live validation test.

AT-004A passed with the previously false-supported evidence correctly assessed as INCONCLUSIVE.

AT-006 passed through completion of a second planned validation item.

The four-line change to validation evidence assessment remains within the existing validation domain logic. No second validation engine was introduced.

The Build 24.2 checkpoint remains protected at `c7d70d0`.

## HP-24.4 - Mission-Driven Discovery Experience

**Scope:** Transform the inventor-facing Discovery interaction from question-driven presentation into a mission-driven engineering experience while preserving the existing Discovery reasoning, Project Engineering State, persistence, validation domain, and approved concept workflow.

### Entry condition

- Build 24.3 is protected at `v24.3-verified-validation-reasoning`.
- Branch begins from verified Build 24.3.
- Existing Discovery reasoning has been inspected.
- Existing Workshop bench orchestration has been inspected.

### Construction constraint

- Do not create a second Discovery reasoning engine.
- Do not redesign validation execution or validation outcome assessment.
- Do not alter the Project as the single source of engineering truth.
- Do not silently bypass the Concept 01 -> Concept 02 -> Concept 03 workflow.
- Preserve existing persistence and Engineering State behaviour.

### Target experience

Each Discovery interaction should be presented as a Mission containing:

- Mission Brief
- Why This Matters
- Your Assignment
- AI Reflection
- Mission Complete
- Next Mission

The inventor should understand what REV has learned, why the next Mission exists, and what remains unknown.

### Acceptance

- Discovery presents a Mission rather than a numbered question.
- The Mission explains why the work matters.
- The inventor receives a clear assignment.
- REV reflects existing Project understanding before asking for further information.
- Completing a Mission preserves the existing Project and Engineering State update path.
- The next Mission follows the existing Discovery reasoning rather than a second decision engine.
- Existing validation behaviour remains unchanged.
- Existing persistence survives refresh.
- Existing concept workflow does not regress.

### Verification Record

**Live acceptance — PASS**

- Mission-driven Discovery journey completed on the home PC.
- Discovery progressed through multiple Missions using the existing `assessDiscovery()` reasoning path.
- Mission completion preserved the existing `recordDiscoveryAnswer()` → Project update path.
- REV's current understanding reflected the updated Project Engineering State.
- Browser refresh preserved the Project, Discovery position, and recorded understanding.
- Discovery reached the existing Discovery Checkpoint without introducing additional questioning.
- Validation planning was handed off to the existing validation system.
- Validation execution started successfully.
- Existing validation required-field protection rejected incomplete evidence.
- One planned validation item was completed successfully. No second planned validation item existed in the generated plan; no additional validation work was invented.
- Living Workshop continuity was verified with the same Project and Engineering State.
- AT-008 / AT-009 Workshop/Discovery continuity checks passed.

**Static quality gate — PASS**

- `npx tsc --noEmit` — PASS.
- `npm run lint` — PASS with 0 errors and 3 pre-existing warnings in `WorkshopShell.tsx`.
- `npm run build` — PASS.
- `git diff --check` — PASS.

**Scope verification**

- Existing Discovery reasoning unchanged.
- No second reasoning or decision engine introduced.
- Validation planning/execution logic unchanged.
- Project persistence and Engineering State behaviour preserved.
- Existing Concept workflow preserved.
- Mission orchestration remains a presentation wrapper around existing Discovery reasoning.

**Verification conclusion**

HP-24.4 live acceptance and static quality requirements have been satisfied. The Mission-driven Discovery construction is VERIFIED against the approved hold-point scope.

### Sign-off

**HP-24.4 STATUS: VERIFIED**

The mission-driven Discovery journey, static quality gate, persistence testing, validation handoff, validation execution, and Workshop/Discovery continuity checks have passed. The verified construction remains within the approved HP-24.4 scope.

## HP-24.5 — Structured Knowledge Capture

**Scope:** Implement F-001 AI Interview v1.0 as conversational text-based knowledge capture using the existing Project Timeline as the authoritative record.

### Entry condition

- Build 24.4 is protected at `v24.4-verified-mission-discovery`.
- Branch begins from verified Build 24.4.
- F-001_AI_INTERVIEW approved feature has been reviewed.
- Architectural decision on ProjectTimelineEventType has been documented.

### Approved knowledge categories

- Problem
- Customer
- Existing Solutions
- Competitive Advantage
- Customer Outcome

### Architectural decision

- Add exactly one new ProjectTimelineEventType: `"knowledge-input-recorded"`.
- Do not add a knowledgeCapture field to EngineeringState.
- Do not create a second knowledge store.
- Project remains the single source of engineering truth.
- Project.timeline remains the authoritative historical record.
- Existing storage/persistence remains unchanged.

### Construction constraint

- Do not modify Discovery reasoning.
- Do not modify Validation planning or execution.
- Do not modify HP-24.4 Mission behaviour.
- Do not alter Concept 01 → 02 → 03 workflow.
- Interview is optional and must not block Discovery.
- Knowledge is not evidence.
- Do not introduce AI confidence, innovation scoring, recommendations or inference.
- Do not introduce Knowledge Graph, Knowledge Vault, voice, image/CAD or document ingestion.

### Target experience

The inventor can provide structured knowledge about their project in a conversational format. Each knowledge entry:

- Is recorded with a timestamp in the Project timeline
- Persists across sessions
- Can be edited, creating new timeline entries rather than replacing originals
- Remains available alongside Discovery, Validation, and Workshop activities

### Acceptance

- AT-011: Knowledge Input Capture — Inventor records a Problem statement; it appears in the UI
- AT-012: All Five Categories Capturable — All 5 knowledge categories can be entered and stored
- AT-013: Knowledge Persistence — Knowledge survives browser refresh
- AT-014: Timeline Entry Created — Each capture creates a ProjectTimelineEvent with type `knowledge-input-recorded`
- AT-015: Edit Preserves History — Editing knowledge creates a new timeline entry; original is not overwritten
- AT-016: Knowledge Isolation — Interview knowledge does not interfere with Discovery, Validation, or Engineering State
- AT-017: Discovery Remains Available Without Interview Completion — Inventor can proceed to Discovery without completing Interview
- AT-018: Workshop/Interview Continuity — Workshop displays Project with interview knowledge; both are available simultaneously
- AT-019: Non-Regression against AT-001 through AT-010 — All existing Discovery, Validation, Workshop, Persistence tests remain passing
- AT-020: Static Quality Gate — `npx tsc --noEmit`, `npm run lint`, `npm run build` all PASS

### Verification Record

**Live acceptance — PENDING**

This hold point has not yet been verified.

**Static quality gate — PENDING**

This hold point has not yet been verified.

**Verification conclusion — PENDING**

This hold point awaits construction and acceptance testing.

### Sign-off

**HP-24.5 STATUS: PENDING**

HP-24.5 may only become VERIFIED after live acceptance, persistence testing, regression testing, and static quality gates pass.

## HP-24.7 — Project-Native Engineering Traceability and Decision Chain

**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN

**Protected foundation:** HP-24.6 at `62bb4e6`, tag `v24.6-living-workshop`

**Construction branch:** `sprint006-build24-7-engineering-traceability`

### Build 1 — Engineering Traceability Contract

**Commit:** `857cf8b`

Established the backward-compatible `ProjectDecision` and `ProjectConceptRef` contracts, optional validation references, supersession fields, and safe legacy normalization. Assumptions and constraints remained `string[]`; no provenance was fabricated and no active decision writer was added at this stage.

### Build 2 — Validation Result Linkage and Engineering State Change History

**Commit:** `12f43a9`

Established the new validation history chain from ValidationPlanItem through ProjectEvidence and `validation-result-recorded` events to typed outcomes and factual Engineering State changed-field names. Inconclusive results remain unresolved, and validation completion does not create a ProjectDecision.

### Build 3 — Project-Native Concept Review and Direction Decisions

**Commit:** `3695953`

Persisted explicit Concept 01 review and Concept 02 direction decisions in the Project, with shared Concept family identity, revisions, timeline decision links, duplicate protection, and same-stage supersession. Generated Concept artifacts and Workshop Concept Validation remained local.

### Build 4 — Trace-Aware REV Workshop Orchestration

**Commit:** `f4dbcf9`

Added a pure read-side trace summary and deterministic Workshop recommendation precedence. REV now consumes active Project decisions and validation trace while remaining read-only with respect to Project truth.

### Final Outcome

- **HP-24.7 status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
- **Build 5 required:** NO
- **Freeze blockers:** NONE
- **Final freeze tag:** `v24.7-engineering-traceability`
- **Tag status:** Created by the final freeze operation

### Authority Boundaries

- `Project.engineeringState` remains the current engineering snapshot.
- `Project.timeline` remains append-only engineering history.
- `Project.evidence` remains authoritative validation evidence.
- `Project.decisions` remains the authority for deliberate engineering choices and directions.
- Validation results do not become Project decisions automatically.
- REV recommendations do not become Project decisions.
- Workshop Concept Validation remains separate from Discovery-owned Project Validation.

### Deferred Capabilities

The following are intentionally deferred and are not HP-24.7 failures:

- Stable assumption identity.
- Stable constraint identity.
- Exact Interview/Discovery source-event provenance.
- Provenance for rewritten uncertainty.
- Explicit evidence selection for Concept decisions.
- Engineering-conclusion and engineering-direction writers.
- Workshop Validation unification.
- Specialist bench engines.
- Autonomous REV engineering decisions.

### Freeze Decision

HP-24.7 is a coherent, tested structural capability frozen underneath HP-24.8.

## HP-24.8 — Stable Engineering Assertion Identity

**Status:** COMPLETE / VERIFIED / READY TO FREEZE

**Protected foundation:** HP-24.7 at `e245c5d`, tag `v24.7-engineering-traceability`

**Construction branch:** `sprint006-build24-8-engineering-provenance`

### Build 1 — Stable Engineering Assertion Identity

**Commit:** `c4f3103`

Established the Project-owned assertion identity and lifecycle contract without changing Engineering State string arrays, adding writers, or fabricating legacy identity.

### Build 2 — First Active Engineering Assertion Writer

**Commit:** `baa04f2`

Discovery creates an active assertion only when the same explicit action adds a genuinely new assumption or constraint string. Legacy matches, duplicates, and similar wording do not promote or infer identity.

### Build 3 — Validation Planning to Active Assertion Identity Linkage

**Commit:** `5f42a9c`

Assumption-derived ValidationPlanItems link `sourceAssertionIds` only when exactly one active exact-value assertion matches. Legacy, ambiguous, uncertainty, evidence-gap, and reported-evidence items remain unlinked.

### Build 4 — Identity-Driven Validation Assertion Lifecycle

**Commit:** `841324f`

Explicitly linked active assumption assertions transition through authoritative Validation: confirmed and refined resolve, challenged becomes challenged, and inconclusive remains active. Validation evidence/result trace remains intact and no ProjectDecision is created.

### Final Outcome

- **HP-24.8 status:** COMPLETE / VERIFIED / READY TO FREEZE
- **Build 5 required:** NO
- **Freeze blockers:** NONE
- **Final freeze tag:** `v24.8-engineering-assertion-identity`
- **Tag status:** To be created by the final freeze operation

### Authority Boundaries

- `Project.engineeringState` remains the current engineering snapshot.
- `Project.engineeringAssertions` remains stable assertion identity and lifecycle history.
- `Project.timeline` remains append-only engineering history.
- `Project.evidence` remains authoritative Validation evidence.
- `Project.decisions` remains deliberate engineering choices.
- REV remains a read-only consumer.
- Validation result is not a ProjectDecision.

### Deferred Capabilities

The following are intentionally deferred and are not HP-24.8 failures:

- Assertion source provenance and `sourceTimelineEventIds`.
- Discovery, Interview, and original-observation provenance.
- Multi-source provenance and derivation rationale.
- Constraint Validation planning and lifecycle execution.
- Uncertainty assertion writer and lifecycle.
- REV assertion presentation.
- Evidence selection for Concept decisions.
- Engineering-conclusion and engineering-direction writers.
- Workshop Validation unification.
- Specialist bench engines.
- Autonomous REV engineering decisions.

### Freeze Decision

HP-24.8 is a coherent, tested stable assertion identity and lifecycle capability ready for final freeze. HP-24.9 is not started.

## HP-24.9 — Trace-Aware Assertion Explanation and Engineering Guidance

**Status:** COMPLETE / VERIFIED / READY TO FREEZE

**Protected foundation:** HP-24.8 at `7a7e303`, tag `v24.8-engineering-assertion-identity`

**Construction branch:** `sprint006-build24-9-trace-aware-guidance`

### Build 1 — Assertion Trace Summary Foundation

**Commit:** `7f5bce0`

Established a pure read model for assertion records, explicit Validation links, typed outcomes, historical assertion state, legacy current assumptions, and unavailable source provenance.

### Build 2 — Trace-Aware Workshop Brief

**Commit:** `605c200`

The existing Workshop Brief now separates recorded Project facts, Validation facts, and REV guidance. It explains active, planned, in-progress, inconclusive, resolved, challenged, and legacy assertion contexts without mutating Project truth.

### Final Outcome

- **HP-24.9 status:** COMPLETE / VERIFIED / READY TO FREEZE
- **Build 3 required:** NO
- **Freeze blockers:** NONE
- **Final freeze tag:** `v24.9-trace-aware-guidance`
- **Tag status:** To be created by the final freeze operation

### Authority Boundaries

- `Project.engineeringState` remains the current engineering snapshot.
- `Project.engineeringAssertions` remains stable assertion identity and lifecycle history.
- `Project.timeline` remains append-only engineering history.
- `Project.evidence` remains authoritative Validation evidence.
- `Project.decisions` remains deliberate engineering choices.
- REV remains a read-only explainer and recommender.
- Validation outcomes do not become Project decisions.

### Deferred Capabilities

- Assertion source provenance.
- Multi-source provenance.
- Interview and original-observation provenance.
- Concept evidence selection.
- Engineering-conclusion and engineering-direction writers.
- Constraint Validation lifecycle.
- Uncertainty identity and lifecycle.
- Specialist benches.
- Workshop Validation unification.

### Freeze Decision

HP-24.9 is a coherent, tested read-side explanation capability ready for final freeze. Build 3 is not required.

## HP-24.10 — Engineering Assertion Source Provenance

**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN

**Protected foundation:** HP-24.9 at `744a24a`, tag `v24.9-trace-aware-guidance`

**Construction branch:** `sprint006-build24-10-assertion-provenance`

### Build 1 — Assertion Source Provenance Contract

**Commit:** `c247e98`

Added optional `ProjectEngineeringAssertion.sourceTimelineEventIds` with structural-only storage normalization. Valid IDs are preserved without referential repair, generated IDs, or legacy backfill. No writer was introduced.

### Build 2 — Discovery Direct Source Provenance

**Commit:** `209ae04`

Discovery is the only production assertion provenance writer. A newly created assumption or constraint directly stores the current `discovery-answer-recorded` event ID. One event may source multiple assertions; existing duplicates and legacy strings are not enriched.

### Build 3 — Provenance-Aware Assertion Explanation

**Commit:** `135c1b1`

The existing Project trace summary and Workshop Brief resolve assertion provenance only by exact event ID. The Brief separates Recorded Project fact, Source, Validation, and REV guidance while keeping provenance distinct from proof, derivation, lifecycle, and Validation evidence.

### Build 4 — Hold-Point Readiness Audit

**Implementation:** NOT REQUIRED

Verified forward-only provenance, legacy compatibility, missing and partially available source states, generic non-Discovery handling, lifecycle stability, read-side purity, browser persistence, writer boundaries, and HP-24.9 recommendation precedence.

### Final Outcome

- **HP-24.10 status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
- **Final freeze tag:** `v24.10-assertion-source-provenance`
- **Freeze blockers:** NONE
- **Assertion provenance writer:** Discovery only
- **Source resolution:** Exact stored event ID only
- **Legacy provenance backfill:** None
- **REV authority:** Unchanged and read-only

### Deferred Capabilities

- Manual and multi-source enrichment writers, supporting-source provenance, and derivation/rationale.
- Interview and original-observation assertion provenance.
- Concept evidence selection and engineering decision writers.
- Constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

### Freeze Decision

HP-24.10 is a coherent, tested, forward-only assertion source provenance capability. Build 4 implementation is not required.

## HP-24.11 — Explicit Concept Decision Evidence Selection

**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN

**Protected foundation:** HP-24.10 at `a4ada350`, tag `v24.10-assertion-source-provenance`

**Construction branch:** `sprint006-build24-11-concept-evidence-selection`

### Build 1 — Concept Decision Supporting-Evidence Writer Contract

**Commit:** `e7d8bf9`

The existing Concept decision writer accepts optional explicit supporting evidence IDs, validates exact current `ProjectEvidence` IDs, preserves order, deduplicates first occurrence, filters unknown IDs, and retains zero-selection and legacy caller compatibility.

### Build 2 — Inventor Evidence Selection at Concept Decision

**Commit:** `71c57ff`

The existing Concept 01 review and Concept 02 direction controls allow the inventor to select zero-to-many current Project evidence records before recording the existing decision. Selection is temporary, clears after success, and does not carry between stages.

### Build 3 — Trace-Aware Concept Decision Evidence Explanation

**Commit:** `e3321ec`

The existing trace summary and Workshop Brief resolve stored supporting evidence by exact ID only. They distinguish none explicitly selected, available, unavailable, and partially available evidence without changing active decision selection or Workshop recommendation precedence.

### Build 4 — Clean Evidence Trace Lint Baseline

**Commit:** `facdae6`

Removed the unused trace type import. No behavior changed; the lint baseline returned to the three known Workshop image warnings.

### Final Outcome

- **HP-24.11 status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
- **Final freeze tag:** `v24.11-concept-evidence-selection`
- **Freeze blockers:** NONE
- **Concept decision writer:** `recordConceptDecision()` only
- **Evidence selection:** Explicit inventor selection only
- **Evidence resolution:** Exact stored evidence ID only
- **REV authority:** Unchanged and read-only

### Deferred Capabilities

- Post-decision evidence editing, automatic evidence recommendation, evidence strength/ranking, and REV evidence selection.
- Engineering-conclusion and engineering-direction workflows.
- Supporting-source provenance and derivation/rationale models.
- Constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

### Freeze Decision

HP-24.11 is a coherent, tested explicit Concept supporting-evidence capability. Supporting evidence remains selected support rather than proof, Validation confirmation, decision provenance, or a recommendation input.

## HP-24.12 — Explicit Engineering Conclusion from Validation Evidence

**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN

**Protected foundation:** HP-24.11 at `a25c314`, tag `v24.11-concept-evidence-selection`

**Construction branch:** `sprint006-build24-12-engineering-conclusion`

### Build 1 — Engineering Conclusion Domain Writer

**Commit:** `fcab3e2`

Established `recordEngineeringConclusion()` using the existing `engineering-conclusion` decision category. Explicit conclusion text, reason, and optional supporting evidence IDs create one decision and one conclusion-recorded timeline event atomically. Exact evidence ID filtering, same-category supersession, and no inferred Validation/source/assertion links are enforced.

### Build 2 — Inventor Engineering Conclusion Action

**Commit:** `d9b6570`

The existing post-Validation review surface now lets the inventor deliberately enter a conclusion and reason, optionally select Project evidence, and explicitly supersede an earlier engineering conclusion. Temporary form state clears after success and is never Project truth before recording.

### Build 3 — Trace-Aware Engineering Conclusion Explanation

**Commit:** `2a7da04`

The existing trace summary and Workshop Brief explain current engineering conclusions, inventor reasons, and exact selected evidence states. Currentness is defined only by explicit engineering-conclusion supersession; multiple independent conclusions may remain current and recommendation precedence is unchanged.

### Build 4 — Hold-Point Readiness Audit

**Implementation:** NOT REQUIRED

Verified explicit inputs, evidence validation, immutable history, supersession, plural current conclusions, malformed-data safety, exact evidence resolution, read purity, browser persistence, writer boundaries, and frozen foundation regression.

### Final Outcome

- **HP-24.12 status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
- **Final freeze tag:** `v24.12-engineering-conclusion`
- **Freeze blockers:** NONE
- **Engineering conclusion writer:** `recordEngineeringConclusion()` only
- **Evidence selection and resolution:** Explicit, exact ID only
- **Current conclusion rule:** Explicit same-category supersession only
- **REV authority:** Unchanged and read-only

### Defensive Malformed-Data Behavior

Circular external conclusion supersession may yield zero current conclusions. It is read safely without recursion, mutation, repair, or fabricated history; the legitimate writer cannot create that shape.

### Deferred Capabilities

- Engineering direction, explicit decision-to-Validation-item links, decision source-timeline provenance, and decision-to-assertion references.
- Automatic evidence ranking, conclusion generation, REV conclusion creation/ranking, and post-decision editing.
- Derivation/rationale graphs, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

### Freeze Decision

HP-24.12 is a coherent, tested, explicit inventor engineering-conclusion capability. Supporting evidence remains support rather than proof, and conclusions remain trace explanation only without recommendation authority.
