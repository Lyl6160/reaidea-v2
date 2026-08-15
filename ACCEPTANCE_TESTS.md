# ACCEPTANCE_TESTS

## Purpose

These tests protect behaviour already constructed.

A build is not considered verified merely because TypeScript, lint, or production compilation succeeds.

## HP-24.7 Consolidated Acceptance Record

**Hold point:** HP-24.7 — Project-Native Engineering Traceability and Decision Chain
**Branch:** `sprint006-build24-7-engineering-traceability`
**Accepted HEAD:** `f4dbcf9`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.7-engineering-traceability`

### Build 1 — Traceability Contract

**Commit:** `857cf8b`

Passed:

- Legacy Project compatibility and missing-decision normalization.
- Legacy and new `ProjectDecision` normalization.
- Valid and malformed optional reference handling.
- No fabricated provenance.
- Assumptions and constraints remain string arrays.
- Real browser legacy Project load, refresh, and navigation compatibility.
- No active decision writer introduced by the contract.

### Build 2 — Validation Result Trace History

**Commit:** `12f43a9`

Passed:

- Validation item → evidence → result event linkage.
- Typed `confirmed`, `refined`, `challenged`, and `inconclusive` outcomes.
- Engineering State changed-field history.
- Inconclusive safety and unresolved uncertainty preservation.
- Real browser persistence and refresh persistence.
- No ProjectDecision created by validation completion.
- Legacy validation events remain valid and unlinked where trace fields did not exist.
- Discovery remains the authoritative Validation owner.

### Build 3 — Project-Native Concept Decisions

**Commit:** `3695953`

Passed:

- Explicit Concept 01 review decision.
- Explicit Concept 02 direction decision.
- Shared Concept family ID and revision identity.
- Reason preservation, including honest empty reasons.
- Timeline decision events linked with `decisionId`.
- Empty supporting evidence and source arrays where no explicit source was selected.
- Repeated identical action prevention.
- Same-stage supersession and no cross-stage supersession.
- Concept 03 regression.
- No fabricated historical Concept decisions, evidence, or source links.
- Generated SVGs remain local.
- Workshop Concept Validation remains local.

### Build 4 — Trace-Aware REV Workshop Orchestration

**Commit:** `f4dbcf9`

Passed:

- Active Concept decision resolution.
- Same-stage superseded decision resolution.
- Broken and cross-stage supersession safety.
- Validation trace consumption.
- Safe semantics for all four validation outcomes.
- Recommendation precedence for Concept accept, refine, and rethink.
- Inconclusive and challenged validation remain visible as unresolved/reconsideration work.
- Recorded Project facts are distinguished from REV recommendations.
- Read-only Project mutation purity.
- Legacy fallback.
- Refresh and Workshop → Discovery → Workshop regression.
- Living Workshop and Concept workflow regression.

### Authority and Deferred Capability Checks

The accepted authority model is:

- `Project.engineeringState` — current engineering snapshot.
- `Project.timeline` — append-only engineering history.
- `Project.evidence` — authoritative validation evidence.
- `Project.decisions` — deliberate engineering choices and directions.
- REV — read-only trace consumer and recommender.

Validation result is not a Project decision. REV recommendation is not a Project decision. Workshop Concept Validation is not Discovery-owned Project Validation.

The following remain deferred and are not HP-24.7 failures:

- Stable assumption identity.
- Stable constraint identity.
- Exact source-event provenance.
- Provenance for rewritten uncertainty.
- Explicit evidence selection for Concept decisions.
- Engineering-conclusion and engineering-direction writers.
- Workshop Validation unification.
- Specialist bench engines.
- Autonomous REV engineering decisions.

### Final Gates

- TypeScript: **PASS**
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings
- Production build: **PASS**
- `git diff --check`: **PASS**
- Hold-point readiness: **PASS**
- Build 5 required: **NO**
- Freeze blockers: **NONE**

## HP-24.8 Consolidated Acceptance Record

**Hold point:** HP-24.8 — Stable Engineering Assertion Identity
**Branch:** `sprint006-build24-8-engineering-provenance`
**Accepted implementation HEAD:** `841324f`
**Status:** COMPLETE / VERIFIED / READY TO FREEZE
**Final tag:** `v24.8-engineering-assertion-identity`

### Build 1 — Assertion Identity Foundation

**Commit:** `c4f3103`

Passed:

- Project-owned assertion contract and lifecycle statuses.
- New Project initialization to an empty assertion collection.
- Legacy normalization without promotion.
- Valid and malformed assertion handling.
- Engineering State string arrays unchanged.

### Build 2 — Discovery Assertion Writer

**Commit:** `baa04f2`

Passed:

- New assumption and constraint identities from explicit Discovery actions.
- Exact Engineering State values and action timestamps preserved.
- Multiple assertions receive distinct IDs.
- Exact duplicate protection.
- Legacy matching strings are not promoted.
- Resolved reintroduction creates a new identity.
- Similar wording does not infer a relationship.
- No provenance or lifecycle transitions.

### Build 3 — Validation Planning Linkage

**Commit:** `5f42a9c`

Passed:

- Optional `sourceAssertionIds` on ValidationPlanItem.
- Exactly-one active exact-value assumption match links its ID.
- Zero matches remain unlinked.
- Multiple active matches remain unlinked without guessing.
- Human-readable target prefix stripping remains unchanged.
- Legacy plans remain valid.
- Non-assertion planning sources remain unlinked.
- Structural storage normalization preserves valid IDs and drops malformed values.

### Build 4 — Validation Assertion Lifecycle

**Commit:** `841324f`

Passed:

- confirmed -> resolved.
- refined -> resolved without supersession.
- challenged -> challenged.
- inconclusive -> active.
- Missing and legacy links remain safe.
- Multiple explicit links transition independently.
- Historical statuses remain unchanged.
- Assertion count and IDs remain stable.
- Validation evidence/result trace remains intact.
- No ProjectDecision, provenance, or extra assertion event is created.
- Disposable browser validation and refresh persistence.

### Authority and Deferred Capability Checks

The accepted authority model is:

- `Project.engineeringState` — current engineering snapshot.
- `Project.engineeringAssertions` — stable assertion identity and lifecycle history.
- `Project.timeline` — append-only engineering history.
- `Project.evidence` — authoritative Validation evidence.
- `Project.decisions` — deliberate engineering choices and directions.
- REV — read-only consumer.

The strongest implemented chain is:

```text
Discovery action
-> current assumption
-> ProjectEngineeringAssertion.id
-> ValidationPlanItem.sourceAssertionIds
-> ProjectEvidence
-> validation result
-> exact assertion lifecycle
```

HP-24.8 does not store assertion source timeline provenance. It does not provide constraint or uncertainty lifecycle coverage through the current Validation planner. Those are deferred capabilities, not freeze blockers.

### Final Gates

- TypeScript: **PASS**
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings
- Production build: **PASS**
- `git diff --check`: **PASS**
- Live disposable Validation acceptance: **PASS**
- Build 5 required: **NO**
- Freeze blockers: **NONE**

## HP-24.9 Consolidated Acceptance Record

**Hold point:** HP-24.9 — Trace-Aware Assertion Explanation and Engineering Guidance
**Branch:** `sprint006-build24-9-trace-aware-guidance`
**Accepted implementation HEAD:** `605c200`
**Status:** COMPLETE / VERIFIED / READY TO FREEZE
**Final tag:** `v24.9-trace-aware-guidance`

### Build 1 — Assertion Trace Summary Foundation

**Commit:** `7f5bce0`

Passed:

- Pure read-only assertion trace summary.
- Active and historical assertion explanation.
- Explicit Validation linkage through `sourceAssertionIds`.
- Typed Validation outcomes remain distinct from assertion lifecycle.
- Legacy current assumptions remain unpromoted.
- Missing relations and provenance remain missing.
- No Project mutation, writer, or schema change.

### Build 2 — Trace-Aware Workshop Brief

**Commit:** `605c200`

Passed:

- Existing Brief explains recorded Project facts and Validation facts.
- REV guidance is visibly separate from stored Project truth.
- Active/no-link, planned, in-progress, inconclusive, resolved, challenged, and legacy cases remain safe.
- Active/inconclusive guidance explains unresolved uncertainty without calling it failure.
- Historical assertions are not presented as current when an active identity exists.
- No raw assertion IDs are exposed in normal UI.
- Concept decision precedence remains unchanged.
- Refresh, navigation, legacy fallback, and read-only purity remain intact.

### Final Gates

- TypeScript: **PASS**
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings
- Production build: **PASS**
- `git diff --check`: **PASS**
- Live disposable Brief acceptance: **PASS**
- Build 3 required: **NO**
- Freeze blockers: **NONE**

### Authority and Deferred Capability Checks

- `Project.engineeringState` remains the current engineering snapshot.
- `Project.engineeringAssertions` remains stable identity and lifecycle history.
- `Project.timeline` remains append-only history.
- `Project.evidence` remains authoritative Validation evidence.
- `Project.decisions` remains deliberate choices.
- REV remains read-only.
- Validation result is not a Project decision.
- Assertion source provenance remains deferred.
- No Project writer or provenance writer was added.

## HP-24.10 Consolidated Acceptance Record

**Hold point:** HP-24.10 — Engineering Assertion Source Provenance
**Branch:** `sprint006-build24-10-assertion-provenance`
**Accepted implementation HEAD:** `135c1b1`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.10-assertion-source-provenance`

### Build Chain

- Build 1 — `c247e98` — Establish assertion source provenance contract.
- Build 2 — `209ae04` — Capture Discovery assertion source provenance.
- Build 3 — `135c1b1` — Explain assertion source provenance.
- Build 4 — Readiness audit only; implementation not required.

### Accepted Contract

- `ProjectEngineeringAssertion.sourceTimelineEventIds` is optional, structurally normalized, and preserves valid unknown IDs without repair, generated IDs, or legacy backfill.
- Discovery is the only production assertion provenance writer. It captures the current `discovery-answer-recorded` event ID directly for each newly created assumption or constraint in the same Project action.
- One Discovery event can source multiple newly created assertions. Existing duplicates receive no added source; legacy strings are not promoted; resolved assertions reintroduced later receive a new identity and a new source event.
- Trace resolution matches stored assertion source IDs exactly to `Project.timeline` event IDs. Not recorded, available, unavailable, and partially available provenance remain distinct.
- The existing Brief separates Recorded Project fact, Source, Validation, and REV guidance. Source records where an assertion was captured, not proof, complete causality, derivation, exact wording, or Validation evidence.
- Identity-backed assertions without source provenance remain valid. Engineering State-only legacy assumptions remain distinct because stable assertion provenance is unavailable.
- Validation lifecycle transitions preserve source IDs. Read-side provenance explanation is pure, shows no raw IDs, and does not alter REV authority or HP-24.9 recommendation precedence.

### Acceptance Results

- Provenance contract, exact-ID resolution, assumption and constraint provenance: **PASS**.
- Duplicate, legacy, reintroduction, multiple/mixed/missing/non-Discovery source cases: **PASS**.
- Validation/origin boundary, lifecycle provenance stability, source versus Validation/lifecycle/derivation: **PASS**.
- Read-side purity, navigation persistence, and live Discovery persistence: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Deferred Capabilities

- Manual or multi-source enrichment writers, supporting-source provenance, and derivation/rationale.
- Interview and original-observation assertion provenance.
- Concept evidence selection and engineering decision writers.
- Constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

Discovery only creates assertions for its existing extraction patterns; an unclassified sentence creates neither an assertion nor assertion provenance. This is not an HP-24.10 provenance defect.

## HP-24.11 Consolidated Acceptance Record

**Hold point:** HP-24.11 — Explicit Concept Decision Evidence Selection
**Branch:** `sprint006-build24-11-concept-evidence-selection`
**Accepted implementation HEAD:** `facdae6`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.11-concept-evidence-selection`

### Build Chain

- Build 1 — `e7d8bf9` — Accept explicit Concept supporting evidence.
- Build 2 — `71c57ff` — Select evidence for Concept decisions.
- Build 3 — `e3321ec` — Explain Concept supporting evidence.
- Build 4 — `facdae6` — Restore clean evidence trace lint baseline.

### Accepted Contract

- `ProjectDecision.supportingEvidenceIds` remains the existing Project-owned field, and `recordConceptDecision()` remains the only Concept decision writer.
- Before either existing Concept 01 review or Concept 02 direction action, the inventor may explicitly select zero-to-many current `ProjectEvidence` records. No evidence is automatically selected.
- The writer persists only exact current evidence IDs, retains supplied order, deduplicates first occurrence, filters unknown IDs, and accepts zero selection.
- Selection is temporary UI state until the existing decision action records it. It clears after a successful decision and does not carry from Concept 01 to Concept 02.
- Historical and superseded decisions retain their own selections without enrichment, copying, or amendment.
- The existing trace summary resolves a decision's stored evidence IDs exactly against `Project.evidence`, preserving empty, available, unavailable, and partially available states without inference.
- Selected evidence is inventor-selected support, not proof, certainty, complete justification, Validation confirmation, decision provenance, or a recommendation input. Validation and decision source provenance remain separate.
- REV does not select evidence and remains read-only. HP-24.10 remains frozen and unchanged.

### Acceptance Results

- Explicit selection, zero/one/multiple selection, deduplication, unknown filtering, and stored order: **PASS**.
- Concept 01/Concept 02 selection, stage reset, success clearing, supersession, legacy decisions, and persistence: **PASS**.
- Empty, missing, mixed, and selected Validation-evidence trace explanations: **PASS**.
- Read-side purity, navigation persistence, and no recommendation-precedence change: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Deferred Capabilities

- Post-decision evidence editing, automatic evidence recommendation, evidence strength/ranking, and REV evidence selection.
- Engineering-conclusion and engineering-direction workflows.
- Supporting-source provenance and derivation/rationale models.
- Constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

## HP-24.12 Consolidated Acceptance Record

**Hold point:** HP-24.12 — Explicit Engineering Conclusion from Validation Evidence
**Branch:** `sprint006-build24-12-engineering-conclusion`
**Accepted implementation HEAD:** `2a7da04`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.12-engineering-conclusion`

### Build Chain

- Build 1 — `fcab3e2` — Establish engineering conclusion writer.
- Build 2 — `d9b6570` — Record inventor engineering conclusions.
- Build 3 — `2a7da04` — Explain engineering conclusions.
- Build 4 — Readiness audit only; implementation not required.

### Accepted Contract

- The existing `engineering-conclusion` ProjectDecision category is reused, and `recordEngineeringConclusion()` is the only conclusion writer.
- Inventor-written conclusion text and reason are recorded only through the existing Validation review surface after Validation evidence exists.
- Supporting evidence is explicit zero-to-many ProjectEvidence selection. Exact current evidence IDs are preserved in supplied order, duplicate first occurrences are retained once, unknown IDs are filtered, and zero selection is valid.
- A successful action creates one decision and one `engineering-conclusion-recorded` timeline event atomically. Project and Project evidence inputs remain immutable.
- Validation item IDs, source timeline event IDs, and assertion relationships are not inferred. Validation outcomes remain evidence context, not conclusion proof.
- Supersession is explicit and only between engineering conclusions. Historical conclusions remain unchanged; independent conclusions remain current together, and no latest-as-active rule exists.
- The trace resolves selected evidence by exact ID only, preserving none-selected, available, unavailable, and partially available states. Supporting evidence is inventor-selected support, not proof, decision provenance, or a recommendation input.
- REV does not create, rank, or select conclusions/evidence. Engineering conclusions do not alter recommendation precedence, and engineering direction remains absent.

### Acceptance Results

- Explicit text/reason, zero/one/multiple evidence, duplicate filtering, unknown filtering, and no inferred links: **PASS**.
- Same-category supersession, cross-category rejection, historical preservation, independent current conclusions, chains, and separate chains: **PASS**.
- Exact evidence resolution, missing/mixed states, read purity, live Validation-review action, navigation, and refresh persistence: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Defensive Malformed-Data Behavior

Malformed externally stored circular engineering-conclusion supersession can yield zero current conclusions. The read side does not crash, recurse, mutate Project, repair, or fabricate history. The legitimate conclusion writer cannot create a circular supersession relationship.

### Deferred Capabilities

- Engineering direction, explicit decision-to-Validation-item links, decision source-timeline provenance, and decision-to-assertion references.
- Automatic evidence ranking, automatic conclusion generation, REV conclusion creation/ranking, and post-decision editing.
- Derivation/rationale graphs, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.

## HP-24.13 Consolidated Acceptance Record

**Hold point:** HP-24.13 — Explicit Engineering Direction with Conclusion Basis
**Branch:** `sprint006-build24-13-engineering-direction`
**Accepted implementation HEAD:** `3f92ac0`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.13-engineering-direction`

### Build Chain

- Build 1 — `75f5357` — Establish engineering direction basis contract.
- Build 2 — `df9a742` — Record inventor engineering directions.
- Build 3 — `3f92ac0` — Explain engineering directions.
- Build 4 — Readiness audit only; implementation not required.

### Accepted Contract

- The existing `engineering-direction` ProjectDecision category is reused; no new decision category or generic dependency graph was added.
- `basisConclusionIds` is the narrow explicit relationship from an engineering direction to the engineering conclusions the inventor selected as its basis. It is not evidence, supersession, Validation scope, provenance, or REV reasoning.
- `recordEngineeringDirection()` is the only direction writer. Inventor-written direction text and reason require one or more explicit current engineering-conclusion IDs, validated exactly and fail closed if any selected basis is missing, wrong-category, or superseded.
- Basis order is preserved, duplicate first occurrences are retained once, and no conclusion is selected automatically. No conclusion evidence, Validation item, source event, or assertion relationship is copied or inferred into a direction.
- One successful action creates one engineering-direction decision and one `engineering-direction-recorded` timeline event atomically. Direction supersession is explicit same-category replacement only; multiple independent directions remain current together.
- The existing Validation review action presents current conclusion bases only, with no evidence selector and separate optional direction supersession control. Temporary form state is not Project truth and clears after success.
- The trace resolves stored bases by exact conclusion ID and preserves no-basis, available, unavailable, and partially available states. A historical basis remains the recorded basis even if it is now superseded; it is never replaced by a later conclusion.
- Directions explain Project truth but do not alter REV recommendation precedence, routing, or write authority. REV does not create directions, select bases, or supersede directions.

### Acceptance Results

- Required current basis, exact validation, duplicate normalization, unknown/wrong/superseded basis rejection, and no copied/inferred links: **PASS**.
- Explicit direction supersession, independent current directions, chains, malformed-data safety, and historical basis stability: **PASS**.
- Current-only basis UI, no preselection/evidence selector, reset, one save path, navigation, and refresh persistence: **PASS**.
- Plural read trace, missing/partial/wrong-category/legacy basis explanation, and unchanged recommendation precedence: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Defensive Malformed-Data Behavior

Malformed externally stored circular engineering-direction supersession can yield zero current directions. The read side does not crash, recurse, mutate Project, repair, or fabricate a current direction. The legitimate writer cannot create a circular direction supersession relationship.

### Deferred Capabilities

- Direction-driven REV recommendation/routing, automatic direction generation, basis selection, and evidence copying.
- Direct direction-to-evidence, Validation-item, source-timeline, or assertion relationships.
- Generic decision graphs, post-decision direction/basis editing, engineering task execution, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification.


## HP-24.14 Consolidated Acceptance Record

**Hold point:** HP-24.14 — Explicit Engineering Action Adoption with Direction Basis
**Branch:** `sprint006-build24-14-engineering-action`
**Accepted implementation HEAD:** `f85bac2`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.14-engineering-action-adoption`

### Build Chain

- Build 1 — `70a1daf` — Establish engineering action adoption contract.
- Build 2 — `6163198` — Adopt inventor engineering actions.
- Build 3 — `f85bac2` — Explain adopted engineering actions.
- Build 4 — Readiness audit only; implementation not required.

### Accepted Contract

- `Project.engineeringActions` is the dedicated Project-owned collection for explicitly adopted engineering actions. An action is not a `ProjectDecision`, `ValidationPlanItem`, Workshop bench, REV recommendation, or `EngineeringState.nextEngineeringStep`.
- `basisDirectionIds` is the narrow explicit relationship from an adopted engineering action to one or more inventor-selected current engineering directions. It is not a generic dependency graph, action status, bench route, Validation relationship, evidence relationship, or recommendation input.
- `recordEngineeringAction()` is the only engineering-action writer. Inventor-written action text requires one or more explicit current engineering-direction IDs. The writer deduplicates supplied basis IDs by first occurrence, preserves order, and fails closed if any selected basis is missing, wrong-category, or superseded.
- One successful action creates one `ProjectEngineeringAction` and one `engineering-action-recorded` timeline event atomically. It does not create or mutate a ProjectDecision, Validation Plan, evidence, Engineering State, assertions, directions, conclusions, or Workshop routing.
- The existing post-Validation/conclusion/direction review surface lets the inventor explicitly enter action text and reason and explicitly select current directions as basis. No basis is preselected; no evidence, bench, lifecycle, priority, due-date, completion, supersession, or Validation controls were added.
- Engineering actions currently record adoption only. HP-24.14 introduces no action currentness, active/pending/completed state, completion result, cancellation, priority, task manager, or action supersession semantics.
- The trace and Workshop Brief read `Project.engineeringActions` in stored order, resolve direction bases only by exact decision ID/category, preserve unavailable and partial references, and may report whether a resolved historical basis direction is now current or superseded. That present-day direction status never becomes action status.
- A later direction supersession never rewrites an action's stored historical basis, substitutes a replacement direction, invalidates the action, or creates automatic execution/routing behavior.
- Adopted actions do not alter REV recommendation precedence, `recommendedBench`, Workshop routing, Validation planning, or REV write authority. REV reads and explains adopted actions only.

### Acceptance Results

- Blank action and zero basis rejection; one/multiple current direction basis; first-occurrence duplicate normalization; fail-closed unknown/wrong-category/superseded/mixed basis handling: **PASS**.
- Independent actions, multiple actions from the same direction, atomic action/event recording, Project immutability, no ProjectDecision/Validation/evidence/EngineeringState mutation, and historical basis stability: **PASS**.
- Current-direction-only inventor UI, no preselection, ordered selection/deselection, one save path, success reset, zero-current-direction blocking, navigation, and refresh persistence: **PASS**.
- Neutral adopted-action trace, exact basis resolution, legacy zero-basis, missing/partial/wrong-category basis safety, later-superseded basis explanation, no raw IDs, read purity, and recommendation invariance: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Defensive Malformed-Data Behavior

Malformed external direction history is read without action-basis repair or substitution. Self-supersession does not erase a direction; missing or cross-category supersession targets do not count; a circular direction-supersession shape may leave a recorded action basis available while that direction is presently classified as superseded. The read side does not mutate the Project, recurse, fabricate a replacement direction, or invent action lifecycle state.

### Deferred Capabilities

- Action lifecycle/status, start/completion/cancellation/result semantics, action supersession, priority, due dates, assignees, and generic task management.
- Action-to-Validation, action-to-evidence, action-to-bench, action-to-source, action-to-assertion, and generic dependency relationships.
- Direction-driven recommendation/routing, automatic action generation/adoption, automatic basis selection, automatic Validation creation, and REV Project write authority.
- Constraint lifecycle, uncertainty lifecycle, specialist benches, and Workshop Validation unification.


## HP-24.15 Consolidated Acceptance Record

**Hold point:** HP-24.15 — Explicit Engineering Action Result History  
**Branch:** `sprint006-build24-15-engineering-action-results`  
**Accepted implementation HEAD:** `595e946`  
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN  
**Final tag:** `v24.15-engineering-action-results`

### Build Chain

- Build 1 — `e017ea9` — Establish engineering action result history.
- Build 2 — `3b397f1` — Record inventor engineering action results.
- Build 3 — `595e946` — Explain engineering action result history.
- Build 4 — Readiness audit only; implementation not required.

### Accepted Contract

- Engineering action results are append-only Project timeline history, not a second action/result store. `engineering-action-result-recorded` is the dedicated event type and `engineeringActionId` is the narrow explicit relationship to one existing adopted engineering action.
- `recordEngineeringActionResult()` is the sole production result writer. It requires nonblank inventor-written result text and an exact existing `Project.engineeringActions[].id`; invalid or unknown action targets fail without a Project write.
- One successful result action appends exactly one `engineering-action-result-recorded` event and preserves the selected engineering action unchanged. Multiple result events may legitimately reference the same adopted action and remain independent history in timeline order.
- An engineering action result records what happened while undertaking an adopted action. It does not mean the action is current, active, pending, completed, successful, failed, cancelled, superseded, or otherwise lifecycle-classified.
- Recording a result does not create or mutate Project evidence, Validation results or plans, Project decisions, Engineering State, engineering assertions, engineering actions, direction/conclusion history, Workshop routing, or recommendation precedence.
- The existing review surface requires explicit inventor selection of an adopted action and explicit inventor-written result text. No action is preselected, all adopted actions remain selectable including actions whose direction basis later became superseded, one successful record uses one Project save path, and temporary UI state resets after success.
- The existing trace and Workshop Brief resolve result history only when both the timeline event type is `engineering-action-result-recorded` and `engineeringActionId` exactly matches the adopted action. Result order follows Project timeline order; unknown action links are not guessed or attached; unusable result text is handled safely without raw IDs.
- Result history remains read-only context for REV. It does not change `recommendedBench`, recommendation precedence, routing, or REV Project write authority.

### Acceptance Results

- Blank result and unknown adopted-action target rejection; exact adopted-action link; multiple results for one action; historical action target after later direction supersession; Project immutability and structural storage preservation: **PASS**.
- Inventor result UI with zero-action blocking, no action preselection, explicit action/result requirements, one writer caller, one save path, success reset, multiple results, historical action selection, navigation and refresh persistence: **PASS**.
- Exact read-side action-result resolution by event type plus action ID, timeline-order preservation, action separation, missing/unknown relationship safety, neutral missing-detail handling, no lifecycle inference, read purity, and recommendation invariance: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Authority Boundary

The accepted Project trace can now retain:

```text
ProjectEvidence
→ Engineering Conclusion
→ Engineering Direction
→ Adopted Engineering Action
→ Recorded Action Result History
```

The final arrow records explicit history only. It does not promote a result into Project evidence, Validation, conclusion, direction, completion state, or new Project authority.

### Defensive / Legacy Behavior

Structurally valid `engineeringActionId` values are preserved by storage even when the referenced action is unavailable. Read-side result history attaches only to an exact existing adopted action and only for the dedicated result event type. Missing links, unknown actions, blank/missing result detail, and historically superseded direction bases are handled without repair, substitution, lifecycle invention, or Project mutation.

### Deferred Capabilities

- Action lifecycle/status, explicit completion/cancellation, action supersession, priority, due dates, assignees, and generic task-management behavior.
- Explicit promotion or conversion of action-result history into Project evidence or Validation, if ever deliberately designed; action-result evidence ranking or automatic engineering conclusions remain absent.
- Direct action/action-result links to Validation, evidence, bench, source, assertions, dependencies, or execution routing.
- Automatic action/result generation, direction-driven routing, automatic Validation creation, and REV Project write authority.
- Constraint lifecycle, uncertainty lifecycle, specialist benches, and Workshop Validation unification.

## HP-24.16 Consolidated Acceptance Record

**Hold point:** HP-24.16 — Explicit Project Evidence Adoption from Engineering Action Results
**Branch:** `sprint006-build24-16-action-result-evidence`
**Accepted implementation HEAD:** `e003835`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.16-action-result-evidence`

### Build Chain

- Build 1 — `ed146a0` — Establish explicit action-result evidence adoption.
- Build 2 — `ad7dbee` — Adopt action results as Project evidence.
- Build 3 — `e003835` — Explain Project evidence source provenance.
- Build 4 — Readiness audit only; implementation not required.

### Accepted Contract

- A recorded engineering action result remains Project timeline history and does not become Project evidence automatically.
- `recordProjectEvidenceFromActionResult()` is the sole production writer for this adoption path. It requires explicit inventor evidence summary/source plus an exact existing `engineering-action-result-recorded` event whose `engineeringActionId` resolves to an existing adopted action and whose recorded result text is usable.
- One successful explicit adoption creates exactly one `ProjectEvidence` item and one `project-evidence-recorded` event. The evidence stores the exact selected source result event ID in `sourceTimelineEventIds`; `validationItemId` and `validationOutcome` remain absent.
- Invalid summary/source, missing/wrong event type, missing linked action, and blank recorded result detail fail closed without Project mutation.
- No automatic evidence adoption, evidence summary generation, source generation, result selection, Validation creation, ProjectDecision mutation, Engineering State mutation, assertion mutation, action mutation, action lifecycle/status, or recommendation change is introduced.
- The inventor UI exposes only valid result events, begins with no selection and empty evidence fields, requires all explicit input before adoption, uses one writer and one save path, resets after success, preserves historical result usability, and supports multiple/duplicate explicit adoptions without inventing lifecycle semantics.
- `ProjectEvidence.sourceTimelineEventIds` is direct recorded source-event provenance only. Read-side trace resolution uses exact stored IDs in stored order and safely distinguishes recorded-and-available, partially available, unavailable, and not-recorded provenance.
- The Workshop Brief explains available action-result detail and exact linked adopted action where present; generic Project source events remain generic; missing/blank relationships remain safe; no raw IDs, source repair, ranking, proof semantics, Project writes, or recommendation changes are introduced.

### Acceptance Results

- Fail-closed domain writer cases, exact result-event provenance, exact linked action, absent Validation fields, unrelated state preservation, historical result usability, multiple-result exact selection, duplicate adoption without lifecycle, legacy evidence compatibility, structural storage preservation, and original Project immutability: **PASS**.
- Inventor UI filtering, zero-valid-result blocking, no preselection/autofill, explicit summary/source gating, one writer caller, one save path, exact persisted provenance, success reset, historical result selection, multiple independent results, duplicate explicit adoption, navigation/refresh persistence, and no automatic writes: **PASS**.
- Pure trace coverage for all provenance availability states, exact event resolution, stored order including duplicate IDs, generic non-action source events, blank result safety, missing linked action safety, read purity, and recommendation invariance: **PASS**.
- Workshop Brief browser coverage for available, missing, partial, generic, blank-result, and missing-action provenance; no raw IDs; stable Workshop → Discovery → Workshop → refresh behavior; source-less legacy evidence creates no provenance noise: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Authority Boundary

The accepted loop is:

```text
ProjectEvidence
→ Engineering Conclusion
→ Engineering Direction
→ Adopted Engineering Action
→ Recorded Action Result History
→ Explicit ProjectEvidence adoption
```

The final step is explicit inventor authority. The presence of a recorded result alone never promotes it into Project evidence.

### Defensive / Legacy Behavior

Legacy evidence with no source provenance remains valid. Missing source IDs remain unavailable; partial provenance stays partial; source order is preserved; generic source events are not mislabeled; blank result detail and missing action relationships are not fabricated or substituted. Readers remain pure and do not repair or mutate Project data.

### Deferred Capabilities

- Evidence lifecycle/status, ranking, proof/verification scoring, evidence supersession, deduplication, merging, or automatic promotion.
- Automatic result-to-evidence adoption, automatic evidence wording/source generation, automatic conclusion/direction/action creation, or REV Project write authority.
- Generic causality/dependency graphs or indirect relationship inference.
- Action lifecycle/status/completion/cancellation, automatic Validation creation, constraint lifecycle, uncertainty lifecycle, specialist benches, and Workshop Validation unification.

## HP-24.17 Consolidated Acceptance Record

**Hold point:** HP-24.17 — Project-Evidence-Driven Engineering Conclusion Review
**Branch:** `sprint006-build24-17-project-evidence-conclusions`
**Accepted implementation HEAD:** `49f4980`
**Status:** COMPLETE / VERIFIED / TAGGED / PUSHED / FROZEN
**Final tag:** `v24.17-project-evidence-conclusions`

### Build Chain

- Build 1 — `49f4980` — Drive conclusions from Project evidence.
- Build 2 — Readiness audit only; implementation not required.

### Accepted Contract

- The existing `recordEngineeringConclusion()` writer remains the sole production Engineering Conclusion writer and remains unchanged.
- Engineering Conclusion review is exposed when `project.evidence.length > 0`; it no longer requires any evidence item to carry `validationOutcome`.
- All recorded ProjectEvidence items remain independently available in stored Project evidence order, including Validation evidence, action-result-derived evidence carrying `sourceTimelineEventIds`, and legacy/source-less evidence.
- Evidence is not preselected, ranked, grouped by source authority, filtered by provenance, or inferred from timeline history.
- Conclusion and reason remain explicit inventor-written input. No automatic conclusion wording or conclusion creation is introduced.
- Exact explicitly selected `supportingEvidenceIds` continue through the existing writer unchanged. Existing supersession behavior, trace explanation, downstream direction semantics, and recommendation precedence remain unchanged.
- HP-24.17 introduces no evidence mutation, Validation mutation, Engineering State mutation, assertion mutation, engineering-action mutation, direction mutation, provenance mutation, additional Project writer, or REV Project-write authority.

### Acceptance Results

- Validation review with zero Project evidence hides Engineering Conclusion review: **PASS**.
- Action-result-derived evidence with no Validation fields exposes Engineering Conclusion review and remains independently selectable: **PASS**.
- Existing Validation evidence behavior remains available: **PASS**.
- Legacy/source-less Project evidence remains available: **PASS**.
- Mixed Project evidence preserves Project evidence order and exposes all evidence as peers: **PASS**.
- Initial conclusion/reason fields remain empty and no supporting evidence is preselected: **PASS**.
- Exact explicit supporting-evidence selections `["E1"]` and `["E1", "E3"]` persist exactly through the existing writer: **PASS**.
- Successful recording resets temporary UI state; Workshop/Discovery navigation and refresh create no automatic conclusions: **PASS**.
- Evidence, Validation Plan, Engineering State, engineering assertions, engineering actions, existing directions, and recorded action-result history remain unchanged except for the deliberate conclusion decision and its expected timeline event: **PASS**.
- HP-24.16 evidence adoption/provenance and recommendation precedence remain unchanged: **PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS** with 3 known pre-existing `<img>` warnings.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Freeze blockers: **NONE**.

### Authority Boundary

The evidence-to-conclusion boundary now depends on recorded ProjectEvidence itself, not on a Validation-specific evidence field:

```text
Recorded ProjectEvidence
→ explicit inventor Engineering Conclusion
```

Evidence provenance can explain where evidence came from, but provenance source type does not grant or remove conclusion-review authority.

### Freeze Decision

Build 1 fully closes the HP-24.17 seam because the existing conclusion domain writer, trace model, supersession behavior, and downstream direction contract were already source-agnostic. No additional production implementation is required.

## AT-001 — Discovery to Checkpoint

**Journey**

Create/open a Project → enter Discovery → answer the responsible questions → reach the Discovery checkpoint.

**Expected**

- Original Observation remains preserved.
- Engineering State updates.
- Discovery stops at a responsible checkpoint.
- Remaining uncertainty is explicit.

## AT-002 — Validation Plan Creation

**Journey**

At the Discovery checkpoint → create Validation Plan.

**Expected**

- Validation Plan persists.
- Plan contains targeted validation activities.
- Refresh does not remove the plan.

## AT-003 — Start Validation

**Journey**

Open Workshop → select Validation → start a planned activity.

**Expected**

- Item becomes IN PROGRESS.
- Project Engineering State reflects the active uncertainty.
- A second item cannot be started while one is active.

## AT-004 — Record Validation Evidence

**Journey**

For the active item → record evidence gathered, evidence source/reference, and result.

**Expected**

- Required fields are enforced.
- Evidence is stored against the Project.
- Validation domain logic assesses the evidence.
- UI does not manually invent the engineering outcome.

## AT-005 — Complete Validation Item

**Journey**

Record a valid result.

**Expected**

- Item becomes COMPLETED.
- Evidence receives a traceable ID.
- Timeline records the result.
- Engineering State updates.
- Refresh preserves the result.

## AT-006 — Continue to Second Validation Item

**Journey**

After item 1 completes → open the next planned item.

**Expected**

- The second item can become IN PROGRESS.
- Its own evidence fields are available.
- Completing item 2 does not overwrite item 1.
- Both results remain traceable.

## AT-007 — Validation Plan Completion

**Journey**

Complete every planned validation activity.

**Expected**

- Plan becomes COMPLETED.
- Completion event is recorded.
- Remaining uncertainty is not falsely represented as zero merely because the plan closed.

## AT-008 — Concept Workflow Non-Regression

**Journey**

Engineering → Concept 01 → visualise → generate → review → Concept 02 → decision → Concept 03 where applicable.

**Expected**

Existing workflow remains usable and persistent.

## AT-009 — Workshop / Discovery Non-Regression

**Journey**

Discovery → enter Workshop → return to Discovery.

**Expected**

The same Project and Engineering State are used.

## AT-010 — Static Quality Gate

Run on the home PC:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

**Expected**

- TypeScript: PASS
- Lint: no errors
- Build: PASS

Existing non-blocking lint warnings must be recorded rather than silently treated as failures.

## Test Evidence Rule

Any synthetic data used to test the software must be clearly treated as TEST / SYNTHETIC DATA and must never become indistinguishable from real Project evidence.

## Build 24.2 Acceptance Record

**Inspection date:** 2026-08-11
**Branch:** `sprint006-build24-validation-execution`
**Result:** VERIFIED WITH ACCEPTANCE LIMITATION

### Results

- **AT-001 — Discovery to Checkpoint:** PASS
- **AT-002 — Validation Plan Creation:** PASS
- **AT-003 — Start Validation:** PASS
- **AT-004 — Record Validation Evidence:** PASS
- **AT-005 — Complete Validation Item:** PASS
- **AT-006 — Continue to Second Validation Item:** NOT EXERCISED
- **AT-007 — Validation Plan Completion:** PASS
- **AT-008 — Concept Workflow Non-Regression:** PASS
- **AT-009 — Workshop / Discovery Non-Regression:** PASS
- **AT-010 — Static Quality Gate:** PASS

### AT-006 Limitation

The legitimate acceptance Project generated a validation plan containing one validation item only. Therefore a second-item execution journey could not be exercised without manufacturing additional Project state.

The production validation model supports multiple validation items, including up to four planned items, but AT-006 is not claimed as passed from this journey.

### Static Quality Notes

- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS, 0 errors and 3 existing `@next/next/no-img-element` warnings
- `npm run build` — PASS
- Production routes generated successfully, including `/workshop`.

### Acceptance Conclusion

Build 24.2 completed the demonstrated validation-workshop journey without an observed regression.

AT-006 remains explicitly untested rather than being represented as passed.
## AT-004A - Negative Evidence Must Not Become Positive Evidence

**Purpose**

Protect against the Build 24.2 defect where a positive keyword inside a negated evidence statement produced a false supported outcome.

**Input**

Evidence stating that no measured evidence exists and that further testing is required.

**Expected**

- Outcome is **inconclusive**.
- The evidence is not classified as **confirmed** merely because the word measured appears.
- Further testing remains explicit.

**Regression coverage**

The assessment must also distinguish genuine supporting evidence, genuine contradictory evidence, and neutral/refining evidence without allowing limiting or negating language to manufacture confirmation.

**Acceptance rule**

This test fails if explicitly absent or not-yet-measured evidence is classified as supported/confirmed.

## Build 24.3 Acceptance Record

**Inspection date:** 2026-08-12
**Branch:** `sprint006-build24-3-validation-reasoning`
**Base commit:** `c7d70d0`

### Results

- **AT-004A - Negative Evidence Must Not Become Positive Evidence:** PASS
- **AT-006 - Continue to Second Validation Item:** PASS
- **AT-010 - Static Quality Gate:** PASS

### AT-004A Live Result

Evidence stating that no measured evidence had been collected and that further testing was required was assessed as **inconclusive**.

The previous Build 24.2 behaviour classified comparable evidence as supported. Build 24.3 now preserves the uncertainty rather than manufacturing confirmation.

### AT-006 Live Result

A second planned validation item was started and completed after the first item. Both validation results remained traceable and the validation plan completed with 2 of 2 items complete.

### Static Quality Result

- `npx tsc --noEmit` - PASS
- `npm run lint` - PASS, 0 errors and 3 existing `@next/next/no-img-element` warnings
- `npm run build` - PASS
- `git diff --check` - PASS

### Construction Position

The Build 24.3 defect correction has passed the demonstrated regression journey and static quality gates. HP-24.3 remains open pending final diff review and sign-off.