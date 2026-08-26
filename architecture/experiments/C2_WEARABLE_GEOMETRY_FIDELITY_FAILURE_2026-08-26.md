# C2 Wearable Geometry Fidelity Failure

- Status: **FUNCTIONAL EXPERIMENT — FOUNDER REJECTED FOR FIDELITY**
- Parent baseline: `484ddf625423cd1b63b7314fcc0f12b88c1899de`
- Product authority: `VPB-WORKSHOP-001`, `VPB-JOURNEY-001`, and the accepted one-Canvas viewer remain controlling.
- Promotion boundary: Do not promote this branch or its output as product authority. No screenshot from the experiment is accepted product evidence.

## Archived path hashes

| Path | SHA-256 |
|---|---|
| `app/lib/ai/types.ts` | `8F5946ECF20ECA6DD0B1127340409F0557CE8B9B0072783225B01C17CE02DDD6` |
| `app/lib/geometry/initialGeometryPlan.ts` | `03BE485FA3F50229C39790CD708D3CD59AFAFFD1653F9EFCCC2FCE7779766B63` |
| `app/lib/geometry/buildConceptGeometry.test.ts` | `DB9FAAB44C111ECC001B9CC1DC611725375512AD7F7167D47944A30A8AD18690` |
| `app/lib/workshop/initialCoreCreation.test.ts` | `9CF0E4A423963F8E909E58524CC487F5F43A36FA49BDD0C9912B16428E1617A6` |
| `app/lib/workshop/conceptCandidateStorage.test.ts` | `D6033B31175CB1383A1D5E41A713E768934109B104574FE3D7C484FE8410F855` |
| `app/workshop/workshopStagePresentation.test.ts` | `0A2C25BFEECB673F289F688308508199467AC9C6F3E9113D0FFB28BBAF0D457F` |

## What the experiment proved

- Provider-free tests passed.
- The live transaction produced a `wearable-enclosure` InitialGeometryPlan with nine validated components.
- Candidate persistence and reload verification completed before Workshop presentation.
- Direct Workshop recovery restored the result through the accepted one-Canvas 3D path without regeneration.
- The automatic Home-to-Workshop client transition stalled after a successful Workshop response and required deliberate direct `/workshop` navigation (`FAIL-NAV-001`).

## Founder rejection

- Geometry plumbing: **PASS**.
- Persistence and restoration: **PASS**.
- Visual fidelity: **FAIL**.
- C2: **REJECTED**.

The Visual Concept and deterministic 3D both resembled a conventional scuba mask. The founder’s intent was sunglasses-first surf eyewear with improved underwater retention, a rubber face seal, and a rear retaining strap.

The failure boundary was broader than geometry alone:

- original reference-image bytes were attached to the local request and safety-scanned, but were not supplied to the engineering-outline generation operation;
- repeated ConceptBrief fields overweighted goggles, diving, seal, and strap wording;
- candidate validation checked structure, source binding, and safety rather than semantic visual fidelity;
- fixed-profile geometry lacked source-aware must-haves, must-avoids, and an open-nose eyewear topology.

## Future classification

C2F must be a general, source-aware fidelity boundary and must not contain a surf-specific production rule. It must preserve the accepted viewer and one-Canvas ownership, distinguish source-backed requirements from reversible assumptions, and retain truthful fallback when fidelity cannot be established.
