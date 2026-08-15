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

HP-24.7 is a coherent, tested structural capability ready for freeze preparation. Documentation updates and the final freeze commit/tag remain subject to REV authorization.
