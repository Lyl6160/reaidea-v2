# ENGINEERING_DECISIONS

Permanent engineering decisions for reAIdea.

## ED-001 — Repository Is Authority

The repository, governance documents, approved blueprints, and tested checkpoints are authoritative.

Chat memory is not authoritative.

## ED-002 — One Project / One Engineering Truth

Every Project has one authoritative engineering state.

Do not create competing Project models, duplicate Project brains, separate inventor truth, investor truth, or conflicting storage records.

## ED-003 — Original Observation Is Immutable

The inventor's original observation is preserved as entered.

Discovery may reinterpret it, but must not silently overwrite it.

## ED-004 — Engineering State Belongs to the Project

Engineering State persists with the Project and is not owned by a conversation or a UI component.

## ED-005 — Evidence and Reasoning Are Separate

Evidence comes from the inventor or real-world testing.

REV reasons about the evidence.

The system must not force the inventor to perform REV's internal engineering classification.

## ED-006 — Validation Outcome Is Domain Logic

Validation execution and outcome assessment belong to the validation domain layer.

The Workshop UI must not become a competing validation engine.

## ED-007 — Validation Is Not Binary Proof

Validation may result in:

- confirmed / supported
- refined
- challenged / not-supported
- inconclusive

An inconclusive result keeps uncertainty alive.

## ED-008 — Discovery Has a Responsible Checkpoint

Discovery should stop when sufficient understanding exists to continue responsibly.

Remaining uncertainty becomes explicit Engineering State and targeted validation work.

## ED-009 — Concept Workflow Is Preserved

The approved concept progression is:

Concept 01 → review → Concept 02 → decision → Concept 03 where refinement is required.

Do not silently remove or bypass this workflow.

## ED-010 — KIS

Keep It Simple.

Internal reasoning may be complex. The inventor-facing bench should remain clear and focused.

## ED-011 — No Confidence-as-Truth

Do not use word count, confidence scores, innovation scores, or similar heuristics as substitutes for engineering evidence.

## ED-012 — No Guessed Patches

A patch must target the exact current repository state.

If the exact source is unavailable, stop and obtain it.

## ED-013 — Construction Hold Points

A verified build is a construction reference point.

After sign-off, unrelated work must not silently alter signed-off behaviour.

## ED-014 — REV Behaviour

REV:

> Challenge the idea. Respect the inventor. Follow the evidence.

REV is an engineering partner, not an all-knowing authority.
