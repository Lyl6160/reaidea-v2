# reAIdea Living Workshop Principal Design Decision

Date: 19 August 2026
Status: PRINCIPAL AND CONTROLLING USER-FACING WORKSHOP DESIGN AUTHORITY

## Principal authority

The existing approved [Living Workshop north-star image](./assets/reAIdea_Workshop_Visual_North_Star_Approved_2026-08-18.png) is the principal and controlling user-facing Living Workshop design authority.

- SHA-256: `03F296EB2900760C016B6E10799EA34A32B94CF6BC372DD7AC8F1BD4C6C3940D`
- Size: 2,208,558 bytes
- Dimensions: 1672 × 941 PNG

This authority is not loose inspiration. The implemented Living Workshop must correspond substantially to its realism, spatial composition, bench clarity, foreground console, central presentation stage, and persistent Workshop experience.

It supersedes any interpretation that the Workshop may ship as a flat, schematic, or diagrammatic CSS room. Material departure from its composition, realism, or interaction model requires another explicit recorded human design decision.

Future walkthroughs identify bugs, defects, usability problems, and implementation differences. They do not replace or redefine this principal vision without explicit human approval.

## Accepted subordinate runtime neutral plate

The accepted [Living Workshop runtime neutral plate](../../public/images/reaidea-living-workshop-runtime-neutral-plate-2026-08-19.png) is preserved for later Build 3 runtime implementation.

- SHA-256: `416D952ABAF3D2C5AD2B3F0A84E4F8F27CC07FFA590F1F394B48395A3DBEA491`
- Size: 1,951,396 bytes
- Dimensions: 1672 × 941 PNG
- Runtime path: `public/images/reaidea-living-workshop-runtime-neutral-plate-2026-08-19.png`
- External archive: `C:\Users\User\Documents\reaidea-local-archives\reAIdea-visual-direction-amended-2026-08-19\reAIdea_Living_Workshop_Runtime_Neutral_Plate_Accepted_2026-08-19.png`

This neutral plate is subordinate to the principal north star. It preserves the realistic eight-bench room, central 3D presentation stage, and realistic foreground console without becoming a flattened substitute for live application truth.

Project wording, Concept imagery and model, REV, bench labels, statuses, guidance, questions, navigation, save actions, and controls remain live accessible overlays. Preserving this asset does not begin Build 3 runtime implementation. Build 4 remains blocked.

## Rejected schematic implementation

Commit `087778c91002bf0f9144cf77f3573311d967fa04` is rejected as the final user-facing visual design because its schematic CSS presentation does not satisfy this principal authority.

The rejected commit remains preserved only as a plumbing and behavioural reference. It does not establish accepted visual direction and must not be used to lower the visual-acceptance standard.

## Visual invariants

The final user-facing Workshop must preserve:

- a bright, polished, realistic physical engineering environment;
- a panoramic Workshop in which Inventor, Engineering, Prototype, Testing, Patent / IP, Manufacturing, Marketing, and Reality remain spatially visible;
- realistic, recognisable, user-friendly engineering workstations;
- clear live bench identity, purpose, and status;
- stronger visual focus for the selected bench without removing the other benches;
- REV centred as the AI Engineering Partner;
- the active Project continuously visible;
- a central presentation stage for the evolving design;
- a realistic foreground console containing live bench information and controls;
- a clear route back to the complete Workshop overview; and
- strong spatial continuity with Home's bright doorway.

## Persistent Workshop interaction

The Living Workshop remains one persistent spatial environment.

Selecting a bench focuses that station, retains the surrounding Workshop and other benches, and changes the foreground console to that bench's live information and controls. It must not replace the Workshop with an unrelated-looking isolated page.

Recommended and active bench state remain distinct. Selection does not alter recommendation authority or Project truth.

## Prototype authority and existing 3D foundation

Prototype is the visual centre for the inventor's evolving design. When a current or viewed Concept revision has valid existing `ConceptGeometry`, the live 3D design must occupy the central presentation stage while the surrounding benches remain visible. Prototype must not be reduced to only a static card. Its foreground console retains relevant live information, representation, revision, refinement, view, and model controls.

The existing implementation audit identified:

- [Prototype3DViewer.tsx](../../app/workshop/Prototype3DViewer.tsx), introduced by commit `36b461e2437f380bb0eb24d3aed85bc2bfea3fd1` (`Sprint 006 WIP: establish visual-first Workshop and Prototype 3D foundation`);
- [RollingBenchFlow.tsx](../../app/workshop/RollingBenchFlow.tsx), which dynamically mounts the viewer when Prototype uses `3D MODEL` and valid geometry is available;
- [WorkshopShell.tsx](../../app/discovery/session/WorkshopShell.tsx), which supplies the current or historically viewed Concept candidate's geometry;
- [conceptGeometry.ts](../../app/lib/geometry/conceptGeometry.ts) and [buildConceptGeometry.ts](../../app/lib/geometry/buildConceptGeometry.ts), which define and bind bounded non-authoritative geometry; and
- [conceptCandidateStorage.ts](../../app/lib/workshop/conceptCandidateStorage.ts), which validates and persists geometry with the existing Concept candidate outside Project truth.

The viewer remains current and conditionally mounted, but its representation defaults to 2D and therefore remains dormant until the inventor chooses 3D. It is a React Three Fiber / Three.js WebGL implementation using `@react-three/fiber`, `@react-three/drei`, and `three`. It constructs bounded geometry in code; it does not use a GLB, GLTF, OBJ, FBX, STL, image-sequence, or CSS model asset.

The existing model supports pointer-driven orbit rotation, zoom, reset, fit, and an optional bounded joint preview. It does not currently auto-spin and has no pause control. Any later automatic presentation rotation must include an explicit keyboard-operable pause/resume control, start paused for reduced-motion users, and retain a static/manual presentation without changing or persisting model truth.

Centre-stage integration must reuse one existing viewer instance and the viewed candidate's existing geometry. It must not create a duplicate Canvas, recreate geometry, fabricate missing geometry, write model presentation state into Project, bypass Concept safety, or change candidate persistence. Where safe geometry is unavailable, the existing truthful unavailable state and persisted 2D Concept fallback remain available.

## Live-truth boundary

The stop-sign example and wording visible in the principal authority are illustrative only. They must not be baked into a runtime background or promoted into current Project truth.

These elements remain live application content:

- inventor reference and active Project wording;
- Concept imagery and 3D design/model;
- bench state, active state, and recommended state;
- REV guidance and prepared information;
- questions, navigation, save actions, and controls.

The implementation uses a project-neutral realistic environment with accessible live HTML controls and current application data. The authority image guides composition but must not become a flattened substitute for functional Project content.

## Responsive and acceptance authority

Desktop preserves the panoramic room, surrounding benches, central presentation stage, and focused console.

Tablet and mobile preserve Workshop context through an accessible compact room overview, map, carousel, or comparable focused-station treatment. They must not reproduce the rejected elongated decorative bench tower. Active bench identity, the existence of the other benches, keyboard order, screen-reader meaning, and reduced-motion behaviour remain clear.

Acceptance requires material visual correspondence with the principal authority. Passing plumbing, button, stacking, and responsive checks alone is insufficient.

## Protected boundaries and current gate

HP-24.38 safety, Project truth, Concept, evidence, VisualDesignSnapshot, ConceptGeometry, candidate persistence, and provider-independent boundaries remain unchanged.

Build 3 is reopened and uncommitted. Runtime reconstruction under this decision has not begun. Build 4 remains blocked. Home CLEAR visual confirmation remains deferred.
