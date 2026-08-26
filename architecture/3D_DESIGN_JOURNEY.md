# reAIdea 3D Design Journey

Activated: 2026-08-25
Status: PROTECTED FOUNDATION + FOUNDER-APPROVED VISUAL DIRECTION

## Why This Record Exists

The 3D journey was difficult, valuable work. It proved that reAIdea can carry one invention from the user's description into a safely bound concept, restore it in the Workshop and let the inventor inspect it interactively. Future agents must extend this foundation rather than unknowingly rebuilding or weakening it.

## User Journey

1. The inventor describes the idea once on Home and may attach supporting evidence.
2. REV reflects its understanding and asks zero or one genuinely useful question.
3. Home saves and verifies one canonical Project.
4. The Creation Theatre honestly shows REV working; footprints/progress indicate real process stages rather than fabricated certainty.
5. Concept generation creates a candidate Visual Concept separate from authoritative Project truth.
6. Deterministic local planning may produce `ConceptGeometry` bound to the same candidate family, candidate ID and revision.
7. Only schema-valid, correctly bound geometry may be presented as Interactive 3D.
8. If geometry is missing or invalid, the same candidate remains visible as a clearly labelled Visual Concept; reAIdea must not pretend that a 2D picture is a 3D model.
9. The candidate and any valid source-bound geometry persist and reload-verify before Workshop navigation.
10. Workshop navigation then restores the same Project-keyed candidate without repeating generation.
11. On first arrival, the current invention appears on the central podium and the Prototype/3D review console opens.
12. The inventor can orbit/move, zoom, reset, fit, inspect axes, use bounded movement previews and open the accessible full-screen viewer.
13. The inventor tells REV what feels right or wrong, keeps developing, reviews changes or explores another direction; new revisions remain traceable.

## Accepted Technical Foundation

HP-24.39 Build 8 at `cf0cf8708c908bd26a73e5ba6990f7473f207b25` accepted the reusable interactive 3D viewer foundation:

- exactly one Three.js Canvas, inline or portal-backed modal;
- automatic framing after relocation;
- orbit, zoom, reset and fit;
- bounded joint preview with pause/resume;
- responsive desktop, compact, portrait and landscape layouts;
- accessible dialog heading, close control, focus containment, Escape close, focus restoration, inert background and scroll restoration;
- reduced-motion behaviour;
- zero provider, application API and external requests during acceptance.

Accepted Build 8 viewer record:

- Path: `app/workshop/Prototype3DViewer.tsx`
- Historical accepted SHA-256: `396873F6543BB040F32FC94F4B40CE845225CD06535EB5320C662667180C1C5B`

HP-24.40 Build 1E-B2B-2 at `4171b8ee426ff7703617e3062b59ac5e5cdf4f8c` remains the accepted one-Canvas/podium and contained decision-panel foundation. The current accepted code checkpoint is C1/S1 at `a62b597e32f98669832f30956bc023eadbcc85e0`; it does not claim surf-goggle Interactive 3D.

## Current Paused 3D Work

B2B-3A is paused and must remain byte-identical until specifically authorized:

- `app/workshop/Prototype3DViewer.tsx` — `226EEE2B8B53289E224995BF2158EAECC488950689D9A589F7B0AD7C1A617EF4`
- `app/workshop/Prototype3DViewer.test.mjs` — `13B7491C0443A5AF408E81709A1A134252ECE463B0C835B3616DCE105D006FD7`

## Truth and Ownership Boundaries

- The canonical Project owns accepted invention truth.
- Generated candidates, `VisualDesignSnapshot` and `ConceptGeometry` remain non-authoritative until deliberate adoption.
- Candidate family, ID, revision and geometry source binding must match.
- Malformed geometry or a source mismatch must refuse safely.
- Camera position is transient UI state, not Project truth.
- A generated concept is not CAD, engineering proof, patent evidence or feasibility validation.
- The STOP/GO model was a disposable acceptance fixture and sample; it is not the product, proof geometry or visual authority.
- Provider keys and raw provider payloads stay out of browser Project state and diagnostics.
- Surf-goggle ConceptGeometry remains unresolved. Its accepted result is the truthful Visual Concept fallback, not Interactive 3D.

## Founder-Approved Finished Presentation

`VPB-JOURNEY-001` connects the proven plumbing to the finished experience:

- REV presents the user's model with open hands.
- The user's invention—not REV—is the primary focal point and remains the inventor's work.
- Energy visually connects the same Project to all eight Workshop stations.
- The Prototype/3D console is immediately understandable and contains Ask REV, left, right, rotate, pan, zoom, axis, fit, reset and full-screen controls.
- The live Project title and truthful progress replace all sample content.

## Never Rebuild Without Cause

Future implementation must reuse the accepted Project persistence, candidate history, geometry validation, restoration path and `Prototype3DViewer`. A new 3D stack, second Canvas, native browser Fullscreen API, parallel Project store or unbound geometry path requires an explicit founder-approved architecture decision.
