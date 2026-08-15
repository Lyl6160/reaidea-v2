# CURRENT_CONSTRUCTION_STATE

**Project:** reAIdea  
**Construction checkpoint:** HP-24.11 — Explicit Concept Decision Evidence Selection
**Branch:** `sprint006-build24-11-concept-evidence-selection`
**Accepted HEAD:** `facdae6`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Last governance update:** 2026-08-15

## Current Hold-Point Candidate

**HP-24.11 — Explicit Concept Decision Evidence Selection**

Protected previous foundation:

- `62bb4e6`
- `v24.6-living-workshop`

Accepted construction chain:

- Build 1 — `857cf8b` — Project engineering traceability contract
- Build 2 — `12f43a9` — Validation result linkage and Engineering State change history
- Build 3 — `3695953` — Project-native Concept review and direction decisions
- Build 4 — `f4dbcf9` — Trace-aware REV Workshop orchestration

Protected previous foundation:

- `e245c5d`
- `v24.7-engineering-traceability`

Accepted HP-24.8 construction chain:

- Build 1 — `c4f3103` — Stable Engineering Assertion Identity
- Build 2 — `baa04f2` — First active Engineering Assertion Writer from Discovery
- Build 3 — `5f42a9c` — Validation planning to active assertion identity linkage
- Build 4 — `841324f` — Identity-driven Validation assertion lifecycle

Final freeze tag: `v24.11-concept-evidence-selection`

Accepted HP-24.9 construction chain:

- Build 1 — `7f5bce0` — Assertion trace summary foundation
- Build 2 — `605c200` — Trace-aware assertion explanation in Workshop Brief

Accepted HP-24.10 construction chain:

- Build 1 — `c247e98` — Assertion source provenance contract
- Build 2 — `209ae04` — Discovery direct assertion source provenance
- Build 3 — `135c1b1` — Provenance-aware assertion explanation
- Build 4 — Readiness audit only; implementation not required

Accepted HP-24.11 construction chain:

- Build 1 — `e7d8bf9` — Explicit Concept supporting-evidence writer input
- Build 2 — `71c57ff` — Inventor evidence selection at Concept decision
- Build 3 — `e3321ec` — Trace-aware Concept supporting-evidence explanation
- Build 4 — `facdae6` — Clean evidence trace lint baseline

## HP-24.8 Capability

HP-24.8 establishes stable Project-owned identity for new Discovery-created assumptions and constraints, carries forward-created assumption identity into Validation planning, and transitions explicitly linked assumption assertions through authoritative Validation.

The implemented forward chain is:

```text
Discovery action
-> current assumption
-> ProjectEngineeringAssertion.id
-> ValidationPlanItem.sourceAssertionIds
-> ValidationPlanItem.id
-> ProjectEvidence.validationItemId
-> ProjectEvidence.id
-> validation-result-recorded
-> typed validationOutcome
-> exact assertion lifecycle status
```

The authority model remains:

- `Project.engineeringState` — current engineering snapshot
- `Project.engineeringAssertions` — stable assertion identity and lifecycle history
- `Project.timeline` — append-only engineering history
- `Project.evidence` — authoritative Validation evidence
- `Project.decisions` — deliberate engineering choices and directions
- REV — read-only trace consumer and recommender

HP-24.8 does not change Engineering State string arrays or provide complete source provenance. Build 5 is not required.

## HP-24.7 Frozen Foundation

HP-24.7 establishes a Project-native traceability backbone for new authoritative engineering history:

- Validation items link to Project evidence, typed outcomes, result events, and changed Engineering State fields.
- Explicit Concept 01 review and Concept 02 direction actions create Project decisions and timeline records.
- Concept revisions share a stable family reference and support same-stage supersession.
- REV reads Engineering State, validation trace, and active Project decisions to recommend the next Workshop bench without mutating Project truth.

The authority model remains:

- `Project.engineeringState` — current engineering snapshot
- `Project.timeline` — append-only engineering history
- `Project.evidence` — authoritative validation evidence
- `Project.decisions` — deliberate engineering choices and directions
- REV — read-only trace consumer and recommender

HP-24.7 remains frozen underneath HP-24.8. Its Project-native validation trace, Concept decisions, and trace-aware REV remain unchanged.

## HP-24.8 Deferred Capabilities

- Assertion source timeline provenance.
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

Missing historical identity and provenance are acceptable. Fabricated identity and provenance are prohibited.

## HP-24.9 Capability

HP-24.9 provides a pure read-side assertion trace summary and a concise Workshop Brief explanation. REV can distinguish recorded Project facts from its guidance, explain active and historical assertion context, consume explicit Validation links and outcomes, preserve legacy assumptions without fabricated identity, and keep missing provenance visibly missing.

HP-24.9 does not add Project writers, provenance, decisions, evidence, lifecycle transitions, or schema changes. HP-24.8 remains frozen underneath it. HP-24.9 Build 3 is not required for the current hold-point claim.

## HP-24.10 Capability

HP-24.10 establishes forward-only, explicit assertion source provenance. New Discovery-created assumptions and constraints store the exact current `discovery-answer-recorded` event ID. One event may source multiple assertions; later duplicate Discovery actions do not enrich existing assertions; and resolved values reintroduced later receive new assertion identity and new source provenance.

`ProjectEngineeringAssertion.sourceTimelineEventIds` is optional and structurally normalized. Missing legacy provenance remains missing, including identity-backed assertions. Source resolution reads only exact stored event IDs from Project timeline history, retaining not-recorded, available, unavailable, and partially available states without inference or repair.

The existing trace summary and Workshop Brief now separate Recorded Project fact, Source, Validation, and REV guidance. Source is not proof, complete causality, derivation, exact inventor wording, or Validation evidence. Validation lifecycle updates preserve assertion origin provenance. REV remains read-only, no second provenance store exists, and HP-24.9 recommendation precedence remains unchanged.

Deferred capabilities include manual/multi-source enrichment writers, supporting-source and derivation models, Interview/original-observation provenance, Concept evidence selection, engineering decision writers, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

## HP-24.11 Capability

HP-24.11 establishes explicit inventor-selected supporting evidence for existing Concept decisions. `ProjectDecision.supportingEvidenceIds` remains Project-owned, and `recordConceptDecision()` remains the only Concept decision writer. The inventor may select zero-to-many current Project evidence records before existing Concept 01 review or Concept 02 direction actions; selection is temporary until the decision records, clears after success, and does not carry across stages.

The writer validates only exact current Project evidence IDs, preserves supplied order, deduplicates first occurrence, filters unknown IDs, and permits zero selection. Historical and superseded decisions retain their own selections without backfill, copying, or amendment.

The existing trace summary and Workshop Brief resolve each selected evidence ID exactly against Project evidence and distinguish none explicitly selected, available, unavailable, and partially available states. Selected evidence is inventor-selected support, not proof, Validation confirmation, decision provenance, or a recommendation input. REV remains read-only, recommendation precedence is unchanged, and HP-24.10 remains frozen underneath.

Deferred capabilities include post-decision evidence editing, automatic recommendation or ranking, REV evidence selection, engineering-conclusion and engineering-direction workflows, supporting-source and derivation models, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

## Historical Build 24.2 Record

The following Build 24.2 record is retained as historical construction context. It is not the current checkpoint.

The intended direction is to connect the existing validation execution domain to the Living Workshop without creating a second validation engine.

The existing `validationExecution.ts` domain logic remains the source of truth for validation execution and evidence assessment.

## Verified Before This Checkpoint

The current Windows development workflow has previously demonstrated:

- `npx tsc --noEmit` passes
- `npm run lint` passes with three existing `@next/next/no-img-element` warnings and no errors
- `npm run build` passes on the Windows development machine
- `/workshop` exists as a route
- Discovery can reach a validation checkpoint
- Validation planning exists
- Validation execution domain logic exists
- Project persistence uses the existing storage engine

## Build 24.2 Acceptance Position

Build 24.2 must not be called verified until the following are demonstrated on the home PC:

1. Validation plan is visible in the Workshop.
2. A planned validation item can be started.
3. Only one validation item can be active at a time.
4. Evidence, source/reference, and result can be recorded.
5. REV/domain logic determines the validation outcome.
6. Completed validation persists after refresh.
7. A second planned validation item can subsequently be started and completed.
8. Engineering State updates from validation evidence.
9. Existing Concept 01 → Concept 02 → Concept 03 workflow remains intact.
10. Existing Discovery → validation planning flow does not regress.

## Current Hold Point

**HOLD POINT HP-24.2-VALIDATION-WORKSHOP**

Do not proceed to unrelated feature construction until Build 24.2 has passed its acceptance journey and been reviewed.

## Next Approved Task

Run the Build 24.2 validation-workshop acceptance journey on the home PC.

Only after that:

- record results,
- update this file,
- commit the checkpoint,
- create a Git tag only if the build is actually verified.

## Recovery Rule

If Build 24.2 fails acceptance, repair the defect without redesigning the architecture unless the evidence demonstrates that the architecture itself is wrong.


## Build 24.2 Verification Record

**Inspection date:** 2026-08-11
**Hold point:** `HP-24.2-VALIDATION-WORKSHOP`
**Branch:** `sprint006-build24-validation-execution`
**Status:** VERIFIED WITH ACCEPTANCE LIMITATION

### Verified Journey

Discovery → checkpoint → validation plan → validation start → evidence capture → REV evidence assessment → validation completion → Engineering State update → persistence.

The existing Concept 01 → Concept 02 → Concept 03 refinement workflow was also exercised successfully.

Workshop ↔ Discovery continuity was exercised successfully using the same Project.

### Static Quality Gate

- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS, 0 errors and 3 existing `@next/next/no-img-element` warnings
- `npm run build` — PASS

### Acceptance Limitation

AT-006 was not exercised because the legitimate acceptance Project generated a single-item validation plan.

The validation domain model supports multiple validation items, but no second item was generated in this acceptance journey. No synthetic validation state was injected merely to force the test.

AT-006 therefore remains explicitly untested.

### Construction Decision

Build 24.2 is considered verified for the demonstrated validation-workshop journey, with AT-006 retained as an explicit acceptance limitation.

The next unrelated construction stage must not begin until this record is committed and the hold point is reviewed.

## Build 24.3 Verification Record

**Inspection date:** 2026-08-12
**Hold point:** `HP-24.3 - Validation Evidence Assessment`
**Branch:** `sprint006-build24-3-validation-reasoning`
**Base checkpoint:** `c7d70d0`
**Status:** VERIFIED

### Verified Correction

The Build 24.2 validation evidence-assessment defect was reproduced and corrected within the existing validation domain logic.

Evidence stating that no measured evidence had been collected and that further testing was required was assessed as **INCONCLUSIVE** during the Build 24.3 live regression.

The correction added four explicit negative/limiting signals:

- `no measured`
- `no measurement`
- `not confirmed`
- `not demonstrated`

No second validation engine was introduced.

### Acceptance

- AT-004A - Negative Evidence Must Not Become Positive Evidence: **PASS**
- AT-006 - Continue to Second Validation Item: **PASS**
- AT-010 - Static Quality Gate: **PASS**

A second planned validation item was started and completed. Both validation results remained traceable and the validation plan completed with 2 of 2 items complete.

### Static Quality Gate

- `npx tsc --noEmit` - PASS
- `npm run lint` - PASS, 0 errors and 3 existing `@next/next/no-img-element` warnings
- `npm run build` - PASS
- `git diff --check` - PASS

### Construction Decision

HP-24.3 is VERIFIED.

Build 24.2 remains protected at `c7d70d0`.

The next construction stage may begin only after this verified checkpoint is committed and tagged.