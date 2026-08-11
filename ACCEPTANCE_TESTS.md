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