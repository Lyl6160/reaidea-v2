# REV_CONTINUITY_001 — reAIdea Continuity Record

**Document ID:** REV-CONTINUITY-001  
**Version:** 1.0  
**Status:** Approved Continuity Baseline  
**Repository Location:** `blueprints/00-Governance/REV_CONTINUITY_001.md`  
**Purpose:** Restore reAIdea design continuity in a fresh chat or development session before any architecture, code, UI, or reasoning changes are made.

---

# 1. Activation Phrase

Use this exact phrase at the start of a new chat:

> **REV-CONTINUITY-001 — reAIdea. Read the continuity record first. KIS. Walk Around It. One Project. One Engineering Truth.**

The phrase alone does not carry authority.

The continuity record, the current repository state, approved blueprints, and current Project state are the authority.

---

# 2. Continuity Rule

A fresh chat must not redesign reAIdea from the code it happens to see.

Before making any design or code decision it must:

1. Read this continuity record.
2. Inspect the current repository / latest uploaded ZIP.
3. Read the relevant approved blueprint documents.
4. Preserve established engineering truth.
5. Identify whether a proposed change is:
   - construction,
   - bug repair,
   - UX refinement,
   - blueprint change,
   - or architectural change.
6. Architectural or philosophical changes require deliberate review with the Chairman before implementation.

> **Do not infer the product from legacy screens. The approved design outranks old prototype UI.**

---

# 3. REV Identity

REV is the engineering partner inside reAIdea.

REV is not a mascot, generic chatbot, motivational character, or all-knowing authority.

REV behaves like an experienced senior engineering partner:

- calm,
- curious,
- evidence-driven,
- practical,
- respectful,
- willing to challenge,
- willing to admit uncertainty,
- focused on the next useful engineering step.

Canonical behavioural line:

> **Challenge the idea. Respect the inventor. Follow the evidence.**

REV must never confuse confidence with evidence.

REV does not dominate the inventor.

REV helps the inventor think more clearly.

---

# 4. Core Workshop Habits

## KIS

**Keep It Simple.**

When complexity begins to engulf the work:

- stop,
- stand back,
- remove unnecessary parts,
- rethink the process,
- choose the simplest structure that still carries the engineering load.

KIS does not mean simplistic.

It means complexity must earn its place.

## Walk Around It

Before committing to an important decision:

- observe it,
- change perspective,
- challenge assumptions,
- consider fabrication / implementation,
- consider use,
- consider evidence,
- then decide.

The design may be technically correct and still be impractical.

---

# 5. reAIdea Core Definition

reAIdea helps people make better engineering decisions by reducing uncertainty until the next responsible step becomes clear.

It is not primarily a chatbot.

It is experienced as an engineering workshop.

The workshop may contain complex reasoning internally, but the inventor-facing bench must remain clear and focused.

> **The workshop can be complicated. The bench should not be.**

---

# 6. One Workshop

There is one workshop.

Do not build separate inventor and investor engines.

Different users or roles may view the same Project through different perspectives.

Changing perspective changes the questions.

It must not change the engineering truth.

---

# 7. One Project. One Engineering Truth.

Every Project maintains one authoritative engineering state.

Do not create competing Project models, duplicate project brains, separate investor truth, separate inventor truth, or conflicting storage records.

The Project is more important than the conversation.

Conversations may disappear.

Engineering truth must persist.

---

# 8. Original Observation

The user's first input is preserved.

It may be:

- an observation,
- an idea,
- a proposed solution,
- a complaint,
- a failure,
- a half-formed thought.

Do not reject it because it is not written as a perfect engineering observation.

Preserve it exactly as the Project's **Original Observation**.

Then Discovery may work backwards to understand the underlying problem.

> **Original Observation must never be silently overwritten.**

---

# 9. Preferred Workshop Name

Module 001 includes an optional field:

> **What would you like us to call you?**

This is not authentication.

It creates a respectful working relationship.

Use the preferred name naturally.

Never hard-code a user's name into source code.

If no preferred name is given, continue naturally without one.

---

# 10. Workshop Door

The Workshop Door is part of reAIdea's identity, not disposable decoration.

Approved visual / experiential elements include:

- dark professional engineering workshop atmosphere,
- Living Engineering Symbol / canonical reAIdea mark,
- subtle illuminated footsteps / steps indicating a journey,
- engineering symbols on workshop walls representing broad engineering domains,
- wall symbols may glow / reveal meaning on hover rather than clutter the scene with labels,
- central inventor bench,
- curiosity before instruction,
- workshop environment rather than generic corporate landing page.

Approved opening language centres on:

> **What have you observed?**

Do not revert to generic AI language such as:

- "Enter prompt"
- "AI interview"
- "Start my innovation"
- "Your AI Innovation Consultant"

The richer Workshop experience may be layered over the tested engine, but must not be forgotten or redesigned from scratch without review.

---

# 11. Discovery Responsibility

Discovery exists to reduce uncertainty until the real engineering problem becomes visible.

Discovery does not rush to a solution.

Discovery should:

- understand what the inventor means,
- separate observation from assumption where useful,
- identify evidence position,
- identify constraints when already supplied,
- identify the greatest remaining uncertainty,
- ask the next best question,
- avoid asking for information already supplied,
- explain why a question matters when useful.

Important behaviour:

> **Understand before challenge.**

Useful inventor-facing capability:

> **WHY THIS QUESTION**

This may later be collapsible for KIS, but the reasoning transparency is valuable.

---

# 12. Engineering State

The Engineering State belongs inside the Project.

The inventor-facing minimum is:

- Current Understanding
- Current Evidence / Evidence Position
- Greatest Remaining Uncertainty
- Next Engineering Step

As Discovery matures, useful structured signals may also include:

- Potential Assumptions
- Constraints
- Consequences
- Validation gaps

Do not expose every internal field at equal visual weight.

Detailed state remains available for auditability, but the user should normally see the next important thing first.

---

# 13. Evidence Rule

The inventor provides real-world evidence.

REV reasons about what that evidence means.

The Project stores the resulting engineering state.

Do not make the inventor perform REV's reasoning.

Specifically:

The inventor should not be required to select an internal conclusion such as:

- Supported by evidence
- Understanding refined
- Understanding challenged
- Inconclusive

Those may remain valid internal engineering-state outcomes.

REV should assess / propose the effect of the evidence and explain why.

Then the inventor may confirm, correct, or discuss REV's interpretation.

> **Evidence comes from the inventor. Reasoning belongs to REV. Engineering State belongs to the Project.**

Synthetic evidence may be used during software acceptance tests only when clearly labelled **TEST / SYNTHETIC DATA**.

Synthetic acceptance-test evidence must never become indistinguishable from real Project evidence.

---

# 14. Validation

Discovery should not continue indefinitely.

When enough understanding exists to proceed responsibly, REV may create a targeted Validation Plan from remaining evidence gaps and assumptions.

Approved checkpoint language:

> **Sufficient understanding to continue responsibly.**

Validation activities may contain:

- target uncertainty / assumption,
- validation method,
- evidence required,
- completion criteria,
- status.

Validation does not require a binary yes / no outcome.

A result may:

- support,
- refine,
- challenge,
- or remain inconclusive.

REV must keep unresolved uncertainty alive when evidence is insufficient.

---

# 15. Sprint 006 Trial Findings

The following behaviours were demonstrated during Builds 1–5 and are considered valuable unless later evidence proves otherwise.

## Build 1

- Project handoff worked.
- Preferred name carried into Discovery.
- Original Observation remained preserved.
- Project persistence survived browser refresh.

## Build 2

- Discovery reasoning layer added.
- Next question selected from the current Project / Engineering State rather than a rigid interview sequence.
- Discovery reasoning survived lint, TypeScript, production build, and live testing.

## Build 3

- Mixed inventor responses were separated into useful signals:
  - evidence,
  - assumptions,
  - constraints,
  - current understanding.
- Discovery avoided re-asking constraints already supplied.
- Next question moved toward the greatest remaining uncertainty.

## Build 4

- Discovery could reach a responsible checkpoint.
- Remaining uncertainty converted into targeted Validation activities.
- Validation Plan persisted after refresh.

## Build 5

Useful:
- Validation execution workflow exists.
- Activity states such as PLANNED / IN PROGRESS / COMPLETED exist.
- Evidence/results can update Engineering State.
- Inconclusive evidence can keep uncertainty alive.

Known issue:
- Validation 1 could complete.
- Validation 2 did not correctly open its input / execution form.
- This is treated as a software state/UI bug, not a reason to redesign Validation.

Important UX finding:
- The inventor should not select the effect evidence has on the Engineering State.
- REV should perform that reasoning.

---

# 16. Anti-Drift Rules

---

# 18. Current HP-24.7 REV Continuity

HP-24.7 is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint after Build 4, commit `f4dbcf9`, on branch `sprint006-build24-7-engineering-traceability`. The final tag is `v24.7-engineering-traceability`.

REV now has deterministic, read-only trace awareness in Workshop orchestration. It can consume:


REV may summarize recorded history and recommend the next Workshop bench. REV does not autonomously mutate Engineering State, create Project decisions, create evidence, complete Validation, or write provenance.

HP-24.7 does not provide full inventor-statement provenance. Assumption identity, constraint identity, exact source-event lineage, explicit Concept evidence selection, specialist engines, and autonomous engineering decisions remain future capabilities. Missing historical provenance is acceptable; fabricated provenance is not.

Build 5 is not required for HP-24.7.

---

# 19. Current HP-24.8 REV Continuity

HP-24.8 is complete and verified through Build 4 at commit `841324f` on branch `sprint006-build24-8-engineering-provenance`, pending final freeze documentation commit and tag. The intended final tag is `v24.8-engineering-assertion-identity`.

The Project now supports stable identity for new Discovery-created assumptions and constraints, exact linkage from assumption-derived ValidationPlanItems, and identity-driven Validation lifecycle transitions. Engineering State remains the current snapshot; assertion records remain identity and lifecycle history.

REV remains read-only. Validation outcomes do not become Project decisions. Source provenance, multi-source lineage, uncertainty identity, constraint Validation lifecycle, and other deferred layers remain future work.

HP-24.9 — Engineering Assertion Source Provenance is not started.

Build 5 is not required for HP-24.8.

---

# 20. Current HP-24.9 REV Continuity

HP-24.9 is complete and verified through Build 2 at commit `605c200` on branch `sprint006-build24-9-trace-aware-guidance`, pending final freeze documentation commit and tag. The intended final tag is `v24.9-trace-aware-guidance`.

REV now explains stored assertion and Validation context in the existing Workshop Brief. It distinguishes recorded Project facts, Validation facts, and REV guidance while remaining read-only. It does not create Project truth, decisions, evidence, provenance, or lifecycle transitions.

HP-24.9 Build 3 is not required. Source provenance, evidence selection, engineering decision writers, constraint/uncertainty expansion, specialist benches, and Workshop Validation unification remain future capabilities.

---

# 21. Current HP-24.10 REV Continuity

HP-24.10 — Engineering Assertion Source Provenance is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint on branch `sprint006-build24-10-assertion-provenance`. The final tag is `v24.10-assertion-source-provenance`.

The Project supports forward-only explicit source provenance for new Discovery-created assertion identities. Discovery is the only production assertion provenance writer: during the same Project action, a new assumption or constraint stores the exact ID of its `discovery-answer-recorded` timeline event. One event may source multiple assertions. Existing duplicates are not enriched, legacy strings are not promoted, and reintroduced historical values receive a new identity and new source event.

Assertion source provenance is optional and structural. Missing historical source provenance remains missing. REV resolves sources only by exact stored assertion source ID against Project timeline event ID, preserving not-recorded, available, unavailable, and partially available states. Source answers where an assertion was recorded, not proof, complete causality, derivation, exact inventor wording, or Validation evidence.

The existing Workshop Brief distinguishes Recorded Project fact, Source, Validation, and REV guidance. Validation lifecycle updates do not rewrite assertion source provenance. REV remains read-only; ProjectDecision provenance, Interview knowledge, and Original Observation are not assertion provenance without an explicit future writer.

Manual/multi-source enrichment, supporting-source and derivation models, Interview/original-observation provenance, Concept evidence selection, engineering decision writers, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification remain deferred. Build 4 implementation is not required.

---

# 22. Current HP-24.11 REV Continuity

HP-24.11 — Explicit Concept Decision Evidence Selection is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint on branch `sprint006-build24-11-concept-evidence-selection`. The final tag is `v24.11-concept-evidence-selection`.

`ProjectDecision.supportingEvidenceIds` remains the existing Project-owned decision field, and `recordConceptDecision()` remains the only Concept decision writer. Before existing Concept 01 review and Concept 02 direction actions, the inventor may explicitly select zero-to-many current Project evidence records. The writer validates only exact evidence IDs, preserves supplied order, deduplicates first occurrence, filters unknown IDs, and permits zero selection.

Selection is temporary UI state until a Concept decision is recorded. It clears after a successful action, does not carry from Concept 01 to Concept 02, and does not enrich historical or superseded decisions. The existing trace summary and Workshop Brief resolve only each stored decision evidence ID against Project evidence, retaining none-selected, available, unavailable, and partially available states without inference.

Selected evidence is inventor-selected support, not proof, certainty, complete justification, Validation confirmation, decision provenance, or a recommendation input. REV does not select evidence and remains read-only. HP-24.10 remains frozen underneath.

Post-decision editing, automatic recommendation/ranking, REV evidence selection, engineering-conclusion and engineering-direction workflows, supporting-source and derivation models, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification remain deferred.

---

# 23. Current HP-24.12 REV Continuity

HP-24.12 — Explicit Engineering Conclusion from Validation Evidence is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint on branch `sprint006-build24-12-engineering-conclusion`. The final tag is `v24.12-engineering-conclusion`.

The existing `engineering-conclusion` ProjectDecision category is now used by the sole `recordEngineeringConclusion()` writer. After reviewing recorded Validation evidence, the inventor may explicitly record a conclusion, a reason, and zero-to-many selected Project evidence records. One successful action creates one decision and one `engineering-conclusion-recorded` event atomically; empty conclusion text is rejected.

Supporting evidence uses exact Project evidence IDs only. Unknown IDs are filtered, duplicate first occurrences are normalized, zero selection is valid, and no Validation-item, source-timeline, or assertion link is inferred. Conclusion supersession is explicit and same-category only; historical conclusions remain unchanged, while multiple independent conclusions can remain current together.

The existing trace summary and Workshop Brief explain only current conclusions and their selected evidence states. Selected evidence is inventor-selected support, not proof, certainty, Validation confirmation, decision provenance, or recommendation authority. REV does not create, rank, or select conclusions/evidence and remains read-only. Engineering direction remains deferred.

Malformed external circular conclusion supersession is read safely without mutation, repair, recursion, or fabricated history; it may yield zero current conclusions. The legitimate writer cannot create that malformed relationship.

Engineering direction, explicit decision links, automatic generation/ranking, REV conclusion creation/ranking, post-decision editing, derivation graphs, constraint lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification remain deferred. Build 4 implementation is not required.

---

# 24. Current HP-24.13 REV Continuity

HP-24.13 — Explicit Engineering Direction with Conclusion Basis is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint on branch `sprint006-build24-13-engineering-direction`. The final tag is `v24.13-engineering-direction`.

The existing `engineering-direction` ProjectDecision category is now used by the sole `recordEngineeringDirection()` writer. An inventor may explicitly record a direction and reason only after selecting one or more current engineering conclusions as its basis. The writer validates every selected basis ID exactly and fails closed if any is missing, wrong-category, or superseded; it preserves selection order, normalizes duplicate first occurrences, and creates one direction decision and one `engineering-direction-recorded` event atomically.

`basisConclusionIds` is the narrow explicit relationship from an engineering direction to its selected conclusions. It is not a generic decision graph, evidence support, supersession, Validation scope, source provenance, or REV reasoning. Directions do not copy conclusion evidence or infer Validation-item, source-timeline, or assertion links. Direction supersession is explicit same-category replacement only, and independent directions may remain current together.

The existing trace summary and Workshop Brief explain current directions and exact stored conclusion bases. A later-superseded conclusion remains the historical basis selected when the direction was recorded; it is never substituted with its successor. Directions remain separate from REV recommendations and do not change recommendation precedence, routing, or REV write authority.

Malformed external circular direction supersession is read safely without mutation, repair, recursion, or fabricated current direction; it may yield zero current directions. The legitimate writer cannot create that malformed relationship.

Direction-driven recommendations/routing, automatic direction/basis/evidence selection, direct direction links beyond conclusion basis, generic decision graphs, post-decision editing, engineering task execution, constraint lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification remain deferred. Build 4 implementation is not required.


---

# 25. Current HP-24.14 REV Continuity

HP-24.14 — Explicit Engineering Action Adoption with Direction Basis is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint on branch `sprint006-build24-14-engineering-action`. The final tag is `v24.14-engineering-action-adoption`.

`Project.engineeringActions` is now the dedicated Project-owned collection for inventor-adopted engineering actions, and `recordEngineeringAction()` is the sole production writer. An inventor may explicitly adopt an action and reason only after selecting one or more current engineering directions as its basis. The writer validates every selected basis ID exactly and fails closed if any is missing, wrong-category, or superseded; it preserves selection order, normalizes duplicate first occurrences, and creates one action plus one `engineering-action-recorded` event atomically.

`basisDirectionIds` is the narrow explicit relationship from an adopted action to its selected engineering directions. It is not a generic dependency graph, task status, evidence relationship, Validation scope, bench assignment, source provenance, or REV reasoning. Actions do not copy direction/conclusion evidence, infer Validation, modify `EngineeringState.nextEngineeringStep`, create Project decisions, or alter direction/conclusion history.

The existing review surface provides explicit inventor action text, reason, and current-direction basis selection with no preselection. The existing trace summary and Workshop Brief explain adopted actions in neutral stored order and resolve only exact stored direction bases. A direction that is later superseded remains the historical action basis selected at adoption; its present direction status may be explained, but no replacement is substituted and no action lifecycle state is inferred.

HP-24.14 records adoption only. There is no current/active/pending/completed/cancelled/superseded action model, no action completion/result machinery, no task manager, and no action-to-bench or action-to-Validation routing. Adopted actions do not change REV recommendation precedence or write authority. REV remains a read-only trace consumer and recommender.

Malformed and legacy action-basis data is read safely without mutation or fabrication. Zero-basis legacy actions remain readable, missing and wrong-category references remain unavailable, partial basis remains partial, and malformed direction supersession does not cause basis replacement or action-status invention.

Action lifecycle/status/completion/results, action supersession, generic task management, direct action links to Validation/evidence/bench/source/assertions, direction-driven recommendation/routing, automatic action generation/adoption, automatic basis selection, automatic Validation creation, constraint lifecycle, uncertainty lifecycle, specialist benches, and Workshop Validation unification remain deferred. Build 4 implementation is not required.

---

# 26. Current HP-24.15 REV Continuity

HP-24.15 — Explicit Engineering Action Result History is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-15-engineering-action-results`. The final tag is `v24.15-engineering-action-results`.

Engineering action result history lives in the existing Project timeline. `engineering-action-result-recorded` is the dedicated event type, `ProjectTimelineEvent.engineeringActionId` is the narrow explicit relationship to one adopted engineering action, and `recordEngineeringActionResult()` is the sole production writer. There is no separate result collection or task-execution store.

The inventor explicitly selects an adopted action and explicitly records what happened. No action is preselected. One successful record appends one result event and leaves actions, decisions, evidence, Validation, Engineering State, assertions, directions, conclusions, Workshop routing, and recommendation precedence unchanged. Multiple results may legitimately reference the same adopted action and remain independent recorded history.

The trace summary and Workshop Brief consume result history read-only. A result attaches to an action only when the event is exactly `engineering-action-result-recorded` and `engineeringActionId` exactly matches that action. Timeline order is preserved. Missing/unknown relationships are not guessed, wrong event types are ignored, unusable result text is handled neutrally, and no raw IDs are presented.

HP-24.15 does not introduce action lifecycle or completion semantics. “Result recorded” does not mean current, active, pending, complete, successful, failed, cancelled, superseded, validated, or promoted to Project evidence. An adopted action whose direction basis later becomes superseded remains historically unchanged and can still carry result history. REV remains a read-only trace consumer and recommender.

Deferred capabilities include explicit action lifecycle/status/completion/cancellation, action supersession, generic task management, deliberate promotion of result history into evidence/Validation if ever required, direct action/result links to Validation/evidence/bench/source/assertions/dependencies, automatic action/result generation, direction-driven routing, automatic Validation creation, constraint lifecycle, uncertainty lifecycle, specialist benches, and Workshop Validation unification. Build 4 implementation is not required.

---

# 27. Current HP-24.16 REV Continuity

HP-24.16 — Explicit Project Evidence Adoption from Engineering Action Results is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-16-action-result-evidence`. The final tag is `v24.16-action-result-evidence`.

A recorded engineering action result remains Project timeline history until the inventor explicitly adopts that exact result event as Project evidence. `recordProjectEvidenceFromActionResult()` is the sole production writer for this path. It requires an exact valid `engineering-action-result-recorded` event linked to an existing adopted engineering action, usable recorded result detail, and explicit inventor-written evidence summary plus source/reference.

Successful adoption creates one `ProjectEvidence` item and one `project-evidence-recorded` timeline event. The evidence records direct source-event provenance in `sourceTimelineEventIds`, containing the exact selected action-result event ID for this writer. This field is direct recorded source provenance only; it is not a generic dependency graph, proof claim, Validation outcome, decision reason, ranking, or inferred causality.

The existing inventor review surface exposes only valid action-result events, begins with no selection and empty evidence fields, and performs no automatic result selection, summary generation, source generation, or evidence promotion. Historical action results remain usable even if their direction basis is later superseded. Repeated explicit adoption of the same valid result may create separate evidence records because no evidence deduplication/lifecycle policy is introduced.

The existing trace summary and Workshop Brief consume `sourceTimelineEventIds` read-only and resolve only exact stored timeline event IDs in stored order. Source provenance may be not recorded, available, partially available, or unavailable. Generic non-action source events remain generic. Missing events, blank result detail, and missing linked actions remain safely unresolved without guessing, repair, substitution, raw-ID presentation, or Project mutation.

HP-24.16 does not modify Validation authority, Engineering State, engineering assertions, adopted engineering actions, Project decisions, action lifecycle/status, recommendation precedence, Workshop routing, or REV write authority. REV remains a read-only trace consumer and recommender.

The accepted engineering feedback loop is:

```text
ProjectEvidence
→ Engineering Conclusion
→ Engineering Direction
→ Adopted Engineering Action
→ Recorded Action Result History
→ Explicit ProjectEvidence adoption
```

Evidence lifecycle/status/ranking, proof semantics, deduplication, generic dependency graphs, automatic result-to-evidence promotion, automatic evidence wording/source generation, automatic conclusion/direction/action creation, action lifecycle/task management, automatic Validation creation, constraint lifecycle, uncertainty lifecycle, specialist benches, and Workshop Validation unification remain deferred. Build 4 implementation is not required.

---

# 28. Current HP-24.17 REV Continuity

HP-24.17 — Project-Evidence-Driven Engineering Conclusion Review is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-17-project-evidence-conclusions`. The final tag is `v24.17-project-evidence-conclusions`.

HP-24.16 made ProjectEvidence source-agnostic by allowing explicit inventor adoption of recorded engineering action results as Project evidence. The existing Engineering Conclusion domain writer was already source-agnostic, but the inventor UI still exposed the conclusion form only when at least one evidence item carried a Validation outcome. HP-24.17 removes that stale UI-only coupling.

Engineering Conclusion review now becomes available whenever recorded ProjectEvidence exists. Validation evidence, action-result-derived evidence with `sourceTimelineEventIds`, and legacy/source-less evidence remain peers at this boundary. Project evidence order is preserved; no evidence is preselected, ranked, grouped by source authority, or filtered by provenance/source type.

`recordEngineeringConclusion()` remains unchanged and remains the sole production Engineering Conclusion writer. Conclusion text, reason, and supporting evidence selection remain explicit inventor authority. Exact selected `supportingEvidenceIds` continue through the existing writer and existing supersession/trace behavior unchanged.

HP-24.17 adds no Project schema, no new writer, no automatic conclusion, no evidence mutation, no Validation mutation, no Engineering State/assertion/action/direction mutation, no recommendation change, and no REV Project-write authority. Existing HP-24.16 evidence adoption and provenance remain unchanged.

The accepted chain is now explicitly source-agnostic at the evidence-to-conclusion boundary:

```text
Recorded ProjectEvidence
→ explicit inventor Engineering Conclusion
→ Engineering Direction
→ Adopted Engineering Action
→ Recorded Action Result History
→ explicit ProjectEvidence adoption
```

Evidence provenance explains recorded origin where present; it does not grant, rank, or remove authority to consider Project evidence. Additional implementation beyond Build 1 is not required for HP-24.17.

---

# 29. Current HP-24.18 REV Continuity

HP-24.18 — Engineering Review Independence from Validation Plan is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-18-independent-engineering-review`. The final tag is `v24.18-independent-engineering-review`.

The inventor engineering loop no longer depends on `Project.validationPlan` existing merely because its controls historically lived inside the Validation Plan view. The review surface is now structurally separated: formal Validation remains conditional on a formal Validation Plan, while Engineering Review can continue from useful recorded Project truth.

Without a Validation Plan, Engineering Review appears only when at least one meaningful review input exists: Project evidence, a current engineering conclusion, a current engineering direction, an adopted engineering action, or a valid adoptable engineering-action-result event. With none of those, no empty review panel is shown and the existing Create Validation Plan path remains available.

The five existing inventor engineering-loop writers remain unchanged: `recordEngineeringConclusion()`, `recordEngineeringDirection()`, `recordEngineeringAction()`, `recordEngineeringActionResult()`, and `recordProjectEvidenceFromActionResult()`. Existing Validation planning/execution writers also remain unchanged. No new Project writer, automatic plan, automatic engineering transition, lifecycle/status semantics, trace/storage change, recommendation change, or REV write authority is introduced.

The accepted separation is:

```text
Recorded Project truth
→ explicit inventor Engineering Review

Formal Validation Plan
→ formal Validation planning/execution
```

These responsibilities may coexist and exchange Project evidence through existing explicit contracts, but neither silently creates or owns the other. Additional implementation beyond Build 1 is not required for HP-24.18.

---

# 30. Current HP-24.19 REV Continuity

HP-24.19 — Shared Engineering Review Surface for the Living Workshop is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-19-shared-engineering-review`. The final tag is `v24.19-shared-engineering-review`.

HP-24.18 established that the inventor Engineering Review is driven by recorded Project truth rather than by the existence of a formal Validation Plan. HP-24.19 makes that accepted review one reusable production surface instead of leaving its implementation owned by the Discovery page.

`ProjectReviewView` is now the single production implementation. Discovery mounts it with default `showValidationPlan=true`, preserving formal Validation Plan rendering/execution and the explicit Engineering Review. The Living Workshop Engineering bench mounts the same component with `showValidationPlan=false`, exposing the existing inventor engineering loop without exposing formal Validation Plan execution there.

The shared engineering loop remains:

```text
ProjectEvidence
→ explicit inventor Engineering Conclusion
→ Engineering Direction
→ Adopted Engineering Action
→ Recorded Action Result History
→ explicit ProjectEvidence adoption
```

The five existing writers remain sole and unchanged: `recordEngineeringConclusion()`, `recordEngineeringDirection()`, `recordEngineeringAction()`, `recordEngineeringActionResult()`, and `recordProjectEvidenceFromActionResult()`. Project storage, trace machinery, recommendation precedence, Validation domain writers, Concept workflow, and REV read-only authority remain unchanged.

The Workshop mount is Engineering-bench-only. Formal authoritative Validation execution remains in Discovery; the Workshop Validation bench is not converted into a second Validation engine. No new Project schema, writer, automatic Project write, automatic transition, lifecycle/status semantics, or automatic Validation is introduced.

Build 1 established the singular shared component and preserved Discovery behavior. Build 2 mounted that exact component on the Workshop Engineering bench with Validation Plan rendering suppressed. No additional Build 3 implementation is required.

---

# 31. Current HP-24.20 REV Continuity

HP-24.20 — Project Evidence Review Coverage is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-20-evidence-review-coverage`. The final tag is `v24.20-evidence-review-coverage`.

HP-24.20 adds no new engineering authority. It exposes a relationship already recorded in Project truth: whether a recorded Project evidence item is explicitly selected by at least one current Engineering Conclusion.

The read-only trace contract is:

```text
Project.evidence
→ exact evidence ID
→ current Engineering Conclusion supportingEvidenceIds
→ conclusionCoverageState
→ exact currentConclusionIds
```

Only current `engineering-conclusion` decisions count. Superseded conclusions are excluded from current coverage. Missing/unavailable evidence references do not falsely resolve to another evidence item. Multiple current conclusions may independently reference the same evidence and remain visible as exact IDs in existing current-conclusion order.

The shared `ProjectReviewView` displays the same Project Evidence Review Coverage in Discovery and on the Living Workshop Engineering bench. The Workshop mount continues to use `showValidationPlan=false`, so formal authoritative Validation execution remains in Discovery exactly as frozen at HP-24.19.

Coverage is descriptive only. It does not rank evidence, score evidence, infer importance, infer contradiction, flag a mandatory gap, preselect supporting evidence, create or supersede conclusions, change recommendation precedence, persist coverage state, or give REV Project-write authority.

Build 1 (`46a8413`) fully closes HP-24.20. Additional Build 2 production implementation is not required.

---

# 32. Current HP-24.21 REV Continuity

HP-24.21 — Historical Evidence Consideration Trace is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-21-historical-evidence-trace`. The final tag is `v24.21-historical-evidence-trace`.

HP-24.21 preserves HP-24.20 current coverage and adds exact historical selection through superseded Engineering Conclusions.

The read-only trace contract is:

```text
Project.evidence
→ exact evidence ID
→ current Engineering Conclusion supportingEvidenceIds
→ currentConclusionIds

Project.evidence
→ exact evidence ID
→ superseded Engineering Conclusion supportingEvidenceIds
→ supersededConclusionIds
```

Only exact stored evidence IDs count. The current/superseded conclusion sets are the existing trace authority. Missing evidence references do not falsely resolve to another evidence item, and multi-step supersession history preserves the existing superseded-conclusion trace order.

The shared `ProjectReviewView` extends the existing Project Evidence Review Coverage rather than creating a second review surface. Discovery and the Living Workshop Engineering bench show the same current and historical selection trace. Workshop Engineering continues to suppress formal Validation through the existing `showValidationPlan=false` seam.

The semantic boundary is important: "never explicitly selected by an Engineering Conclusion" means no recorded conclusion contains that evidence ID in `supportingEvidenceIds`. It does not prove the evidence was unread, mentally unconsidered, unimportant, incorrect, stale or in need of another conclusion.

Historical selection is engineering history only. It does not restore a superseded conclusion to current authority, rank evidence, change recommendation precedence, persist new Project state, trigger automatic prompts/writes, or give REV Project-write authority.

Build 1 (`a24f950`) fully closes HP-24.21. Additional Build 2 production implementation is not required.

---

# 33. Current HP-24.22 REV Continuity

HP-24.22 — Engineering Action Result Evidence Adoption Trace is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-22-action-result-evidence-trace`. The final tag is `v24.22-action-result-evidence-trace`.

HP-24.22 exposes the existing explicit boundary between recorded Engineering Action Results and inventor-adopted Project evidence.

The read-only trace contract is:

```text
engineering-action-result-recorded event
→ exact event ID
→ ProjectEvidence.sourceTimelineEventIds exactly [event ID]
→ adoptedEvidenceIds
```

This exact one-source provenance shape mirrors the frozen `recordProjectEvidenceFromActionResult()` writer. The writer itself remains unchanged. Multiple explicit adoptions of one result remain allowed and appear as multiple Project evidence IDs in stored Project evidence order.

Project evidence with a different source, multiple source timeline IDs, or missing/unavailable source IDs does not count as this exact action-result adoption shape. No result text, action text, source text, Validation state or conclusion state is used to infer adoption.

The shared `ProjectReviewView` adds one Action Result Evidence Adoption Trace surface while preserving the existing inventor-controlled Adopt Project Evidence UI. Discovery and the Living Workshop Engineering bench show the same trace. Workshop Engineering continues to suppress formal Validation through the existing `showValidationPlan=false` seam.

An unadopted result remains valid engineering history. The trace does not mean that evidence adoption is required, does not mark an action complete, does not score or rank the result, does not change recommendation precedence, and does not give REV Project-write authority.

Build 1 (`2ea111a`) fully closes HP-24.22. Additional Build 2 production implementation is not required.

---

- Innovation Brain as a separate truth source
- Project Brain as a competing project model
- AI Confidence derived from word count
- Innovation Score used as engineering confidence
- duplicate project storage keys
- separate role engines that create separate truth

Old code may contain useful implementation work.

Do not delete legacy code merely because the name is old.

Inspect what it does first.

Keep useful mechanics.

Remove or rename only after deliberate comparison.

---

# 17. Repository / Construction Discipline

The repository is the long-term memory.

Chats are working rooms.

Approved documents live in the repository.

Current principle:

> **Preserve first. Modify second.**

Before a major refactor:

- create / retain a current ZIP snapshot,
- inspect current code,
- compare against approved design,
- classify changes as:
  - KEEP
  - MODIFY
  - REMOVE
  - RESTORE

Do not blindly roll back good code because it was written in a different chat.

Do not blindly keep code because it passes tests.

Passing tests proves implementation behaviour, not design alignment.

---

# 18. Current Development Machine Rule

The home PC is the primary and only development machine going forward.

Do not create workflows that depend on swapping between work and home computers.

Old work-PC ZIPs may be used as baseline evidence only.

---

# 19. REV Continuity Handshake Test

Before a fresh chat is trusted to make changes, ask it these questions.

## Q1
What does KIS mean inside reAIdea?

Expected:
Complexity must earn its place. Stop, stand back, simplify the process without weakening the engineering purpose.

## Q2
What does Walk Around It mean?

Expected:
Deliberately examine the same problem from multiple relevant perspectives before committing.

## Q3
Who supplies engineering evidence during real validation?

Expected:
The inventor / project team supplies real evidence. REV may define what evidence is needed and interpret evidence provided.

## Q4
Who decides what the evidence appears to do to current understanding?

Expected:
REV reasons about the evidence and proposes the effect. The inventor may confirm, correct, or discuss it.

## Q5
What happens to the Original Observation?

Expected:
It is preserved exactly and never silently overwritten.

## Q6
What is the relationship between Investor and Inventor perspectives?

Expected:
One Project, one Thinking Engine, one engineering truth. Perspectives change the questions, not the truth.

## Q7
What should REV do before proposing a solution?

Expected:
Understand the observation/problem, identify uncertainty, inspect evidence/assumptions/constraints, then reduce the most important uncertainty.

## Q8
What is the Workshop Door supposed to feel like?

Expected:
A professional engineering workshop with curiosity, footsteps / journey cues, engineering wall symbols, Living Engineering Symbol, inventor bench, and observation-first entry — not a generic chatbot form.

## Q9
What is more important: the chat or the Project?

Expected:
The Project. Conversations are temporary; engineering truth must persist.

## Q10
May a new chat redesign architecture because the current code suggests a different structure?

Expected:
No. It must read continuity / approved blueprints first and discuss any architectural change deliberately before implementing it.

---

# 20. Failure Condition

If a fresh chat cannot answer the handshake questions consistently:

> **Do not allow it to modify the repository.**

Re-upload:

- `REV_CONTINUITY_001.md`
- the latest lean source ZIP
- the relevant blueprint files

Then repeat the handshake.

---

# 21. Working Motto

> **Observe.**  
> **Walk Around It.**  
> **Keep It Simple.**  
> **Build With Evidence.**

And:

> **Challenge the idea. Respect the inventor. Follow the evidence.**

---

# 22. Continuity Status

This document records the approved continuity baseline after the Sprint 006 continuity failure between chat threads.

It is intentionally concise enough to restore operating context, but it does not replace:

- the Constitution,
- Core Domain Model,
- Module 001,
- Module 002,
- Foreman specification,
- Discovery Discipline,
- Project Lifecycle,
- current source code,
- current Engineering Review records.

Where conflicts arise:

1. Current approved controlled documents take precedence.
2. Current Project / source evidence is inspected.
3. Historical chat prose does not silently override controlled documents.
4. Architectural changes require deliberate review.

---

# 34. Current HP-24.23 REV Continuity

HP-24.23 — Engineering Direction Action Adoption Trace is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-23-direction-action-trace`. The final tag is `v24.23-direction-action-trace`.

The protected foundation is `03deb9b14835d5d8e6310797f634cbe7674643bb`, tagged `v24.22-action-result-evidence-trace`. Accepted Build 1 is `f8d82979e96a4c7fc9a181c3d2dd69ba682bdf78` (`Sprint 006 Build 24.23.1: expose direction action adoption trace`). Build 2 implementation is not required.

The accepted read-only contract is:

```text
Engineering Direction.id
→ exact EngineeringAction.basisDirectionIds
→ adopted Engineering Action IDs
```

Both current and superseded directions are represented. Adopted actions retain Project order; one multi-basis action may appear under multiple exact directions. Superseded-direction adoption remains historical and does not restore current authority. Missing IDs never resolve by text, reason, chronology or recommendation inference.

No linked action means only: “No adopted Engineering Action explicitly references this direction.” It does not mean ignored, rejected, abandoned, failed, low priority, incomplete or requiring an action.

`recordEngineeringAction()` remains unchanged and still requires current Engineering Directions at write time. HP-24.23 adds no lifecycle, completion, ranking, priority, recommendation change, automatic action creation, automatic prompt, Project schema/storage change, new writer or REV Project-write authority.

---

# 35. Current HP-24.24 REV Continuity

HP-24.24 — Informational Specialist Bench Contribution Capture is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-24-specialist-contributions`. The final tag is `v24.24-specialist-contributions`.

The frozen parent is `efa30b98927b8247c1bef74f8e5b43119bdf91e6`, tagged `v24.23-direction-action-trace`. Accepted Build 1 is `e3a1813559e6b1a87b4eda1678106c87837929bf` (`Sprint 006 Build 24.24.1: add specialist bench contribution capture`). Build 2 implementation is not required.

Exactly four informational specialist benches can record contributions: Patent / IP, Marketing, Manufacturing / Costing and Reality. Knowledge, Engineering, Prototype and Validation remain excluded because they retain distinct existing semantics.

```text
Inventor explicit submit
→ recordSpecialistContribution()
→ one specialist-contribution-recorded Project.timeline event
→ exact specialistBenchId provenance
→ Project.updatedAt
→ existing onProjectChange/saveProject persistence
```

`Project.timeline` is authoritative. There is no new top-level specialist store. Read-back uses exact bench provenance; valid identity survives normalization and invalid identity is not fabricated.

The contribution is neutral Project history only. It is not automatically evidence, Engineering State, an assertion, conclusion, direction, action, decision, Validation, recommendation, requirement, proof or task state. Recommendation precedence and REV authority remain unchanged, and no Project write occurs before explicit inventor submission.

---

# 36. Current HP-24.25 REV Continuity

HP-24.25 — Explicit Specialist Contribution Evidence Adoption is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-25-specialist-evidence`. The final tag is `v24.25-specialist-evidence`.

The frozen parent is `1822c69a81d731e9c379b72aa71488686a4d2f68`, tagged `v24.24-specialist-contributions`. Accepted Build 1 is `b808986db78c47be94e3e85b94664cca5a4e7e82` (`Sprint 006 Build 24.25.1: add specialist contribution evidence adoption`). Build 2 implementation is not required.

```text
specialist-contribution-recorded
→ explicit inventor evidence adoption
→ one ProjectEvidence
→ sourceTimelineEventIds exactly [selected contribution event ID]
→ one project-evidence-recorded audit event
```

The contribution remains neutral Project history until explicitly adopted through the separate specialist evidence writer. HP-24.16 `recordProjectEvidenceFromActionResult()` remains unchanged. Bench identity remains authoritative on the referenced contribution event and is not duplicated onto the audit event.

Historical valid contributions remain adoptable. Duplicate explicit adoption is allowed, with one evidence item and one audit event per inventor action and no dedupe, merge, ranking, replacement or lifecycle. Read-only adoption trace uses exact single-event provenance; multi-source evidence does not count.

There is no automatic promotion into Engineering State, an Engineering Assertion, Conclusion, Direction or Action, a Project Decision, Validation or recommendation. The Project model, storage, specialist contribution writer, existing engineering writers, Validation writers, recommendation precedence and REV authority remain unchanged.

---

# 37. Current HP-24.26 REV Continuity

HP-24.26 — Shared Specialist Project Context is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-26-specialist-project-context`. The final tag is `v24.26-specialist-project-context`.

The frozen parent is `6ab127758a0ba921787bd96dcbbae02172bfcd4e`, tagged `v24.25-specialist-evidence`. Accepted Build 1 is `5cb1f76be203066638f6eb0831090c4ece04ba65` (`Sprint 006 Build 24.26.1: add shared specialist Project context`). Build 2 implementation is not required.

Exactly Patent / IP, Marketing, Manufacturing / Costing and Reality receive the same concise factual Project Context at the point of specialist work. Where recorded, it shows current understanding, current constraints, greatest remaining uncertainty, Project evidence summaries and source/reference, current Engineering Conclusions, current Engineering Directions and adopted Engineering Actions.

```text
existing Project + EngineeringTraceSummary truth
→ pure bounded specialist Project context helper
→ identical read-only panel on four specialist benches
→ no Project or localStorage write
```

The panel excludes raw Project timeline, superseded conclusions and directions, detailed Validation history, specialist-specific relevance filtering and specialist-generated interpretation. It exposes no raw IDs. Five-item presentation limits preserve authoritative order and do not rank the visible facts.

Existing bench-specific reason and `nextMove` guidance remains unchanged. `workshopBrain`, recommendation precedence, the global REV Workshop Brief, Specialist Contribution, Specialist Evidence Adoption, all writers, Project model, storage and REV authority remain unchanged. No new persisted state or writer exists.

---

# 38. Current HP-24.27 REV Continuity

HP-24.27 — Read-Only Specialist Inquiry Prompts is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-27-specialist-inquiry-prompts`. The final tag is `v24.27-specialist-inquiry-prompts`.

The frozen parent is `bdb1d9723083875f4fa0ddb980b729011afa6c92`, tagged `v24.26-specialist-project-context`. Accepted Build 1 is `4f0a80cf92fb437d0e9d69f9469a1e08d2305361` (`Sprint 006 Build 24.27.1: add read-only specialist inquiry prompts`). Build 2 implementation is not required.

Exactly Patent / IP, Marketing, Manufacturing / Costing and Reality receive deterministic read-only inquiry prompts. Each has a transparent fixed discipline lens, at most four prompts and neutral structural notes about whether recorded Project context categories exist.

```text
selected specialist bench + existing SpecialistProjectContext structure
→ pure fixed inquiry framework
→ transient read-only Specialist Inquiry panel
→ no Project or localStorage write
```

The helper performs no free-text semantic interpretation and introduces no runtime AI/model analysis. Prompts are explicitly for consideration and are not recorded Project truth, specialist findings, evidence, decisions, engineering objects, Validation or recommendations. Patent / IP includes a non-legal-advice boundary.

No new persisted state, writer, storage, runtime model/API integration, recommendation logic or Project schema exists. `workshopBrain`, recommended bench, reason/`nextMove`, Specialist Project Context, both specialist workflows, the global REV Workshop Brief and REV authority remain unchanged.

---

# 39. Current HP-24.28 REV Continuity

HP-24.28 — Workshop-First Routing Foundation is complete, verified, tagged, pushed, and frozen on branch `sprint006-build24-28-workshop-first-routing`. The final tag is `v24.28-workshop-first-routing`.

The frozen parent is `98d5741bb52819969b0226d7e8a9edf120b413b6`, tagged `v24.27-specialist-inquiry-prompts`. Accepted Build 1 is `ee874dc68ff4012834a30ea579dc3abcbe721ccc` (`Sprint 006 Build 24.28.1: establish Workshop-first routing`). Build 2 implementation is not required.

The Living Workshop is the canonical application hub. Fresh Project creation now routes directly to `/workshop` through “Enter Workshop.” The accepted journey is:

```text
Entry / Home
→ Workshop Hub
→ existing work area
→ explicit Back to Workshop
```

The Workshop retains its canonical eight benches and existing `workshopBrain` readiness/recommendation authority. Knowledge exposes clear Continue Discovery and Open Knowledge Interview actions. Discovery returns to Workshop during work and at checkpoint; Interview returns during work and after completion. `/dashboard` is a compatibility redirect to `/workshop` and no longer competes as a hub.

No browser Back action is required for the normal journey. No new Project state, writer, readiness engine, recommendation change, Discovery/Interview/Validation semantic change, specialist workflow change or automatic routing Project write exists.

---

# 40. Current HP-24.29 REV Continuity

HP-24.29 — Standard Bench Shell + Patent/IP Ledger Proof is complete, verified, browser-accepted, tagged, pushed, and frozen on branch `sprint006-build24-29-standard-bench-shell`. The final tag is `v24.29-standard-bench-shell`.

The frozen parent is `d8fb230ee0636e6fc12d19aef92b20c834cdcf96`, tagged `v24.28-workshop-first-routing`. Accepted Build 1 is `f6996b719d3d0eca1b20e78747a7c91fbb4fbc33`; accepted Build 2 is `1b1f7f995685bce1a6bd5a7d0b79e3ae6884445a`; Build 3 is not required.

The first reusable Standard Bench Shell is presentation-only. Its locked anatomy is LEFT — REV / bench context; CENTER — bench work area; RIGHT — Project Ledger; BOTTOM — Back to Workshop, current bench identity and disabled Ask REV marked Coming later. Patent / IP is the proof bench only; other benches retain their existing presentation paths until deliberately migrated.

---

# 41. Current HP-24.30 REV Continuity

HP-24.30 — Prototype Bench Workflow Entry + Procedural Concept Study is complete, verified, browser-accepted, tagged, pushed, and frozen on branch `sprint006-build24-30-prototype-study`. The final tag is `v24.30-prototype-study`.

The frozen parent is `de7361f900f5bb2bc26f8dd9c6f9ee4be65765b6`, tagged `v24.29-standard-bench-shell`. Accepted Build 1 is `f0fe4e863ac4ff39a27ed697309742d88d7c1ac7`, Sprint 006 Build 24.30.1: repair Prototype entry and procedural concept study. Build 2 implementation is not required.

The accepted user flow is Workshop → Prototype → StandardBenchShell → Project-derived Concept Sheet → Begin Visual Study → Visual Concept Brief → Create Procedural Concept Study → inventor review/refinement/direction → Back to Workshop. Direct Prototype entry no longer appears empty, and Engineering is no longer a hidden UI prerequisite merely to unlock Prototype. Engineering remains responsible for technical definition; Prototype creates a tangible working representation for inspection and iteration.

The current visual output is explicitly a procedural concept study. Generated SVG content remains workshop-local and is not CAD, runtime AI image generation, validation, Project truth, ProjectEvidence, Engineering State, an adopted concept, a Project artifact or proof of feasibility. Existing `recordConceptDecision()` semantics remain unchanged; only deliberate inventor review/direction decisions cross into canonical Project truth.

Prototype localStorage behavior is unchanged. THIS BENCH clearly separates workshop-local study state from Project-recorded decisions, while PROJECT reads existing Project truth. No new Project artifact state, ledger store, storage architecture, writer, recommendation precedence or automatic Project write exists. Back to Workshop remains available and Ask REV remains disabled as Coming later.

Browser acceptance passes direct selection, immediate Concept Sheet, visual-study initiation, procedural generation, visible authority boundaries, ledger updates and return/re-entry. The generic procedural SVG placeholder is accepted for HP-24.30 and does not constitute invention-specific visual design.

Genuine invention-specific visual concept generation is deferred. Future work may consider Project engineering truth → bounded visual brief → real generated visual candidate → inventor review → explicit adoption/decision, while preserving the accepted authority boundary. This deferral is not a freeze blocker.

---

# 42. Current HP-24.31 REV Continuity

HP-24.31 — Neutral Workshop Entry + Recommended Bench Attention is complete, verified, browser-accepted, tagged, pushed, and frozen on branch `sprint006-build24-31-neutral-workshop-entry`. The final tag is `v24.31-neutral-workshop-entry`.

The frozen parent is `477e0f2292f39c655e27d3fe6f1892a29ff5e7fe`, tagged `v24.30-prototype-study`. Accepted Build 1 is `138ec7d4ce80521b9e74cfb2c01273db8d37bb4f`, Sprint 006 Build 24.31.1: separate Workshop recommendation from bench selection. Build 2 implementation is not required.

The accepted entry flow is Enter Workshop → full Workshop overview → no bench selected → existing `workshopBrain` recommendation visible → recommended bench receives restrained attention → inventor deliberately chooses a bench → selected workspace opens. Recommendation does not equal selection, and selected bench remains ephemeral UI state only.

`workshopBrain` remains sole authority for recommended bench, readiness/state, reason and next move. No hard-coded Inventor / Knowledge recommendation or second recommendation system exists. Direct bench click and the REV CTA select deliberately; choosing another bench does not overwrite the recommendation.

Back to Workshop clears selection and restores `WORKSHOP FLOOR` / `NO BENCH SELECTED` with the recommendation preserved. Fresh observation-only Projects correctly recommend Inventor / Knowledge and retain dormant Prototype readiness. Entry, recommendation highlighting, selection, CTA navigation and Back cause no Project write, timeline event, `updatedAt` mutation, decision, evidence or Engineering State change.

Ask REV remains disabled as Coming later. Prototype HP-24.30 and Patent StandardBenchShell behavior remain preserved. Browser acceptance and all static gates pass; freeze blockers are NONE.

More atmospheric recommended-bench illumination, pulse, physical glow and environmental light response are deferred. Any future presentation enhancement must continue consuming existing `workshopBrain` truth and must not introduce new readiness semantics.

---

# 43. Current HP-24.32 REV Continuity

HP-24.32 — Inventor / Knowledge Bench Discovery Input is complete, verified, browser-accepted, tagged, pushed, and frozen on branch `sprint006-build24-32-knowledge-discovery-input`. The final tag is `v24.32-knowledge-discovery-input`.

The frozen parent is `915214121c6a563f6ed487d016ddb5ee432c0d24`, tagged `v24.31-neutral-workshop-entry`. Accepted Build 1 is `29135969e0202751de35ee71fb492c4a2618e9c2`, Sprint 006 Build 24.32.1: add Discovery input to Inventor Knowledge bench. Build 2 implementation is not required.

The accepted flow is Workshop → deliberate Inventor / Knowledge selection → current Discovery question → answer → Record & Continue → unchanged `recordDiscoveryAnswer()` → existing Project persistence → reassessment → next question or derived checkpoint → Back to neutral Workshop. Normal Discovery answering no longer requires leaving the bench.

Question authority remains unchanged `assessDiscovery(project)`. Answer authority remains unchanged `recordDiscoveryAnswer()`. Discovery and Knowledge Interview remain separate, and `/discovery/session` plus `/interview` remain intact. One answer creates only the existing Discovery write path; no duplicate event, Knowledge Interview entry, ProjectEvidence, ProjectDecision or additional mutation exists.

The StandardBenchShell contains REV context, current question and input, read-only Discovery/Project ledgers, Back to Workshop and disabled Ask REV. The accepted browser walkthrough reaches all six areas and the derived checkpoint while preserving neutral entry and showing readiness changes produced solely by existing Project truth and `workshopBrain`.

Fresh Engineering is AVAILABLE with Prototype and Validation DORMANT. The first realistic response advances readiness to UNDERSTANDING without forcing those benches. At Discovery completion Engineering and Prototype become READY, Patent / IP becomes recommended/pulsing, Marketing and Manufacturing / Costing become AVAILABLE, and Validation plus Reality remain DORMANT.

Future product direction is non-authoritative visual idea evolution before validated truth: Original Idea → early recorded inventor input → evolving concept preview → continued Workshop refinement → later engineering and validation challenge. HP-24.33 — Cross-Bench Idea Evolving Preview is proposed but not started during this freeze.

The Project Ledger is read-only, transient UI with THIS BENCH and PROJECT tabs. Patent THIS BENCH uses existing specialist contribution and exact ProjectEvidence-adoption truth. PROJECT uses existing Project and specialist Project Context truth. No raw IDs are displayed, no ledger state is persisted, and no new store, timeline, evidence collection, notes system, writer or Project semantics exist.

Patent Specialist Inquiry, legal boundary, contribution capture and explicit evidence adoption remain semantically unchanged. Project context moved from the oversized Patent center panel into the concise Ledger. `workshopBrain` remains sole authority for bench state, reason, `nextMove`, recommendation and precedence. Back to Workshop is an in-app UI action; no browser Back is required. Ask REV remains disabled and no fake REV interaction or runtime model integration was introduced.

REV and the inventor browser-accepted the shell structure and Build 2 presentation. Richer workbench atmosphere, bench-specific artwork/theme, empty-ledger height, internal scrolling, final typography and final Workshop Hub visual redesign remain deferred and are not blockers.

---

**END OF REV-CONTINUITY-001**
