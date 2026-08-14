# WORKSHOP-002 — Living Workshop Vision

Status: HP-24.6 Build 1 reference

## Purpose

The Living Workshop is the presentation and orchestration layer around one evolving reAIdea Project. It should feel like a connected engineering workshop where REV and specialist benches help the inventor move the same Project forward.

The visual reference for this direction is [reaidea Workshop vision reference](./assets/reaidea-workshop-vision-reference.png). The image is a design direction and architectural reference, not evidence that every pictured capability currently exists.

## One Project

The active `Project` remains the single source of engineering truth. Workshop benches observe the same Project identity and Engineering State. No bench creates a Project copy, an isolated Project model, or a second authoritative store.

`Project.timeline` remains the authoritative historical record for durable engineering activity. Knowledge, evidence, validation results, and future decisions must remain in their existing ownership boundaries rather than being duplicated by Workshop presentation code.

## REV and Bench Ownership

REV is the engineering partner presented across the Workshop. REV explains the current Project state, why a bench matters, and the next responsible move. That presentation does not create a second reasoning engine.

The canonical Build 1 bench model is:

1. Inventor / Knowledge
2. Engineering
3. Prototype
4. Validation
5. Patent / IP
6. Marketing
7. Manufacturing / Costing
8. Reality

Bench identity and basic presentation metadata are defined by one canonical Workshop registry. Bench selection remains an in-room presentation interaction rather than eight separate routes.

Each bench has an ownership boundary:

- **Inventor / Knowledge** opens the existing Interview capability. Interview knowledge remains timeline-backed and distinct from Engineering State and validation evidence.
- **Engineering** presents the existing Engineering State and the existing Concept workflow.
- **Prototype** presents the existing Concept 01, Concept 02, and Concept 03 progression where available.
- **Validation** signals validation readiness in Workshop, while authoritative planned validation item execution remains in Discovery.
- **Patent / IP** is informational until a dedicated specialist capability exists.
- **Marketing** is informational until a dedicated specialist capability exists.
- **Manufacturing / Costing** is informational until a dedicated specialist capability exists.
- **Reality** is informational until a dedicated specialist capability exists.

## State Ownership

Project-backed state includes the Project identity, Engineering State, Validation Plan, evidence, and timeline. Discovery, Validation, and Interview continue to use their existing domain modules and storage paths.

Workshop-local presentation state may contain temporary or presentation-specific state such as current bench selection and the existing Concept visual workflow persistence. This local state must not become a second authoritative Project, knowledge, evidence, validation, or Engineering State store.

Active benches may expose an existing capability. Dormant or informational benches must remain honest and must not imply that an unimplemented specialist engine exists.

## Existing Responsibilities

### Interview

Interview captures the five approved knowledge categories through `/interview`:

- Problem
- Customer
- Existing Solutions
- Competitive Advantage
- Customer Outcome

It records knowledge through the existing append-only `knowledge-input-recorded` timeline event. It does not copy knowledge into Engineering State.

### Discovery

Discovery owns Discovery reasoning, mission progression, Engineering State updates, the Discovery checkpoint, and the handoff into validation planning. Discovery reasoning must not move into `WorkshopShell`.

### Validation

Validation planning and planned validation item execution remain authoritative in Discovery. `Project.validationPlan.items` is executed through the existing Discovery UI and validation domain functions.

The current Workshop Validation panel is a separate concept-validation presentation workflow. It does not render the planned validation items and does not call the authoritative validation execution functions. This is a known pre-existing Workshop integration limitation and is outside HP-24.6 Build 1 repair scope.

### Concept

The existing Concept workflow remains intact:

```text
Concept 01
-> visualise
-> generate
-> review
-> Concept 02
-> decision
-> Concept 03 where applicable
```

Build 1 does not redesign Concept persistence or move Concept state into Project storage.

## Navigation

`/workshop` is the canonical Living Workshop entry for Build 1. Discovery and Workshop navigate through the existing active Project. Interview is reached from the Inventor / Knowledge bench through `/interview` and observes the same active Project.

The existing `/dashboard` route remains in place. Build 1 does not perform a broad routing migration or create eight bench routes.

## Future Visual Direction

The installed reference image shows the long-term direction: one active Project at the centre, REV as the engineering partner, and specialist benches surrounding the same evolving work. Future construction may deepen the visual room, bench capabilities, and cross-bench handoffs, but each expansion must preserve one Project, one authoritative history, and explicit responsibility boundaries.

The reference should guide architecture and experience without being treated as a claim that all visualized benches or specialist capabilities are already implemented.
