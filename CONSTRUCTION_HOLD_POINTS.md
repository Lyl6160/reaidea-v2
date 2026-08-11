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
