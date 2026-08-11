# ACCEPTANCE_TESTS

## Purpose

These tests protect behaviour already constructed.

A build is not considered verified merely because TypeScript, lint, or production compilation succeeds.

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
