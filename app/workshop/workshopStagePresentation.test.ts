import assert from "node:assert/strict";

import type { ConceptCandidate } from "../lib/ai/types";
import { buildGeometryFromInitialPlan, buildInitialGeometryPlan } from "../lib/geometry/initialGeometryPlan";
import { resolveWorkshopStagePresentation } from "./workshopStagePresentation";

const candidate: ConceptCandidate = { candidateId: "candidate-a", conceptFamilyId: "family-a", revision: 1, title: "Fixture", visualMode: "product", representationStyle: "product-concept", status: "generated", createdAt: new Date(0).toISOString(), sourceBriefVersion: 1, sourceBriefHash: "fixture", sourceEventIds: [], output: { type: "image", dataUrl: "data:image/png;base64,AA==", mediaType: "image/png", altText: "fixture" }, disclaimer: "fixture" };
const plan = buildInitialGeometryPlan({ originalObservation: "A portable STOP/GO traffic-control sign for roadside deployment, with outdoor stability, illumination and remote operation." });
const built = buildGeometryFromInitialPlan(candidate, plan);
assert(built.geometry);
if (built.geometry) {
  const available = { ...candidate, initialGeometryPlan: plan, conceptGeometry: built.geometry, conceptGeometryStatus: "available" as const };
  assert.equal(resolveWorkshopStagePresentation(available).kind, "interactive-3d");
  assert.equal(resolveWorkshopStagePresentation({ ...available, conceptGeometry: { ...built.geometry, source: { ...built.geometry.source!, candidateId: "candidate-b" } } }).kind, "visual-concept");
}
assert.equal(resolveWorkshopStagePresentation({ ...candidate, conceptGeometryStatus: "unsupported-geometry" }).kind, "visual-concept");
assert.equal(resolveWorkshopStagePresentation(null).kind, "empty");
console.log("Workshop stage presentation fixtures: PASS");
