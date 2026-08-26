# B2B-3A Viewer Experiment — 26 August 2026

**Status:** EXPERIMENTAL — NOT PRODUCT AUTHORITY
**Parent:** `484ddf625423cd1b63b7314fcc0f12b88c1899de`

## Preserved paths

- `app/workshop/Prototype3DViewer.tsx`
  - SHA-256: `226EEE2B8B53289E224995BF2158EAECC488950689D9A589F7B0AD7C1A617EF4`
- `app/workshop/Prototype3DViewer.test.mjs`
  - SHA-256: `13B7491C0443A5AF408E81709A1A134252ECE463B0C835B3616DCE105D006FD7`

## Experimental purpose

This experiment explored a podium-centred default camera, bounded above-horizon
orbit, restrained cyan and warm-gold lighting, engineering-prototype materials
and edges, and a shared grounded restoration path for FIT and RESET. It
preserved the existing single `Prototype3DViewer` mount and one Canvas
expression.

PAN and AXIS controls are absent. The bounded joint-preview control is not an
axis-control substitute.

## Unaccepted evidence boundary

The following remain unaccepted:

- final visual scale and model prominence;
- desktop, compact and mobile responsive behaviour;
- refitting after geometry replacement in an existing viewer mount;
- reduced-motion behaviour for camera restoration;
- component-edge performance at the geometry component limit;
- runtime equality of FIT and RESET results;
- final lighting and material quality.

No founder visual acceptance was granted for this experiment.

## Controlling authority

`VPB-WORKSHOP-001` and `VPB-JOURNEY-001` remain the current visual and journey
authorities. This record does not supersede them and does not authorize product
implementation.

## Future classification

Revise under a new bounded viewer contract after C2 ConceptGeometry exists and
can provide representative tall and low/wide geometry for provider-free visual
review. Do not adopt this experiment merely because it is archived.
