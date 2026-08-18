# reAIdea Founder Journal — HP-24.38 Design Decision

**Date:** 18 August 2026  
**Status:** Build 1 accepted and pushed

## The Product Correction

> The inventor tells REV once. REV carries that understanding throughout the Workshop.

Live walkthrough testing and product observation exposed a deliberate evolution in reAIdea's direction: REV should do more work and ask fewer questions. The inventor should not have to repeat known information at every bench or progress through another mandatory questionnaire before useful work appears.

Home becomes the birthplace of the invention. It asks for the inventor's name and one rich invention description containing as much as the inventor already knows. An Understanding Meter communicates **Starting**, **Taking Shape**, or **Ready for Workshop**. If the inventor is stuck, **ASK REV** asks one short question about the most important missing information. When REV has enough to begin, Home says:

> I have enough information to get started.

> Enter the Workshop and we'll develop your invention from here.

The action is **ENTER WORKSHOP**. There is no mandatory questionnaire.

## Quiet Concept 01

The inventor does not need a separate image-generation action. On Workshop entry, reAIdea may begin non-authoritative Concept 01 generation quietly. If ready, the concept is already visible. If still generating, the Workshop opens normally and Prototype or IDEA EVOLVING may show the approved footstep progress. Provider and API mechanics remain hidden.

## Tell REV Once

REV routes relevant parts of one shared understanding to the benches that need them:

- “It is about 30 cm tall” may inform Engineering, Prototype, and Manufacturing / Costing.
- “It should help drivers notice warnings earlier” may inform Testing, Marketing, and Reality.
- “It uses a rechargeable battery in the post” may inform Engineering, Testing, Manufacturing / Costing, and Reality.

Do not ask the inventor to repeat information REV already has.

## REV Working Understanding Boundary

REV may maintain a provider-neutral derived working understanding covering purpose, problem, users, dimensions, materials, components, colours, movement, power, environment, benefits, constraints, safety, unknowns, and clues relevant to testing, manufacturing, marketing, and IP or distinctiveness.

That working understanding is not automatically ProjectEvidence, a ProjectDecision, an Engineering Conclusion, an Engineering Direction, an Engineering Action, validated Engineering truth, or a formal Validation result. Unknown remains unknown. The Project remains the single authoritative system; HP-24.38 must not create a second Project truth model.

## Bench Philosophy

Every bench should open with:

1. What REV already knows.
2. What REV has prepared.
3. One smart question only if genuinely needed.

REV does the work first. The inventor corrects, confirms, or fills critical gaps. Every bench should open with something useful already prepared from what the Workshop knows.

Inventor Bench remains available but is no longer mandatory. Its purpose becomes reviewing the original idea, adding another thought, correcting REV, adding notes, later uploading a sketch or file, and revisiting the original invention description. It must not force the historical fixed six-question sequence.

## Locked Principles

- **Tell REV Once:** “The inventor tells REV once. REV carries that understanding throughout the Workshop.”
- **REV Does More Work:** “REV should do more work and ask fewer questions.”
- **Output-First Bench:** “Every bench should open with something useful already prepared from what the Workshop knows.”
- **Smallest Question:** “REV asks only the smallest question needed to remove an important gap.”
- **No Repetition:** “Do not ask the inventor for information REV already has.”

## Existing Architecture Preserved

Preserve the always-visible Workshop, active-bench glow and pulse, red/yellow/green guidance, footstep progress, Prototype revision history, candidate durability, VisualDesignSnapshot, ConceptGeometry, the interactive 3D viewer, safe 3D refusal, provider independence, Project truth boundaries, no-dead-end navigation, **MODEL ≠ RENDER**, **Hide the labour. Show the progress.**, and KIS.

## Historical Record

Earlier Inventor and Engineering question flows remain valid historical construction decisions. HP-24.38 is an intentional product evolution discovered through live walkthrough testing and competitive/product observation; the history is not rewritten to imply this direction always existed.

## Build 1 Closeout

**HP-24.38 — Home Intelligence + Workshop Information Routing**

**Build commit:** `fbc9be3b1ae8c8c9b2e1863f93c90508b96bfb12`
**Push:** Passed on `sprint006-build24-36-engineering-concept-model`

Build 1 proved that Home can capture one rich invention description, measure understanding deterministically, and ask one short helping question when needed. Home creates the existing authoritative Project exactly once and preserves the complete description as `Project.originalObservation`.

The Workshop opens immediately with no bench selected. Concept 01 starts automatically through the existing provider-independent pipeline, the branded footstep progress communicates IDEA EVOLVING, and candidate persistence restores the generated concept. Output-first presentation works without making Inventor's Bench mandatory: Inventor remains available for additions and corrections while Engineering is the recommended development bench.

REV now derives a source-traceable working understanding and routes relevant context to the live benches. Each bench shows what REV already knows and what REV prepared, with at most one smallest missing question. Specialist answers preserve the displayed routed-question provenance in the existing `ProjectTimelineEvent.subject`; one routed answer closes the question, and historical subjectless contributions remain readable without invented attribution.

Project schema and truth boundaries remain unchanged. The derived understanding creates no parallel truth. VisualDesignSnapshot, ConceptGeometry, safe 3D behavior, and provider independence remain preserved.

### What We Learned

- Tell REV Once works best when Home owns the first complete description and downstream benches consume routed context.
- Recommended and active are separate states; the Workshop can recommend Engineering while leaving every bench closed.
- Presentation choices such as the inventor-hero product concept are not new Project information and must not make a current candidate appear stale.
- Routed question provenance must travel with the recorded contribution rather than being reconstructed from legacy prompt order.

### Deferred Follow-ups

- Generated concept quality needs improvement.
- The small Workshop concept preview needs improvement.
- Visual sizing, spacing, and graphics were intentionally not assessed in Build 1.
- The current Home PC requires Node system CA support for provider HTTPS.
- Three existing image-optimization lint warnings remain non-blocking.
