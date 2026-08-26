import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
const wearablePlan = buildInitialGeometryPlan({ originalObservation: "A face-mounted inspection viewer enclosure with a rigid frame, front shield panel and adjustable head strap." });
const wearableBuilt = buildGeometryFromInitialPlan(candidate, wearablePlan);
assert(wearableBuilt.geometry);
if (wearableBuilt.geometry) {
  const wearableCandidate = { ...candidate, initialGeometryPlan: wearablePlan, conceptGeometry: wearableBuilt.geometry, conceptGeometryStatus: "available" as const };
  assert.equal(resolveWorkshopStagePresentation(wearableCandidate).kind, "interactive-3d");
  assert.equal(resolveWorkshopStagePresentation({ ...wearableCandidate, conceptGeometry: { ...wearableBuilt.geometry, source: { ...wearableBuilt.geometry.source!, revision: 2 } } }).kind, "visual-concept");
}
const unsupportedWearablePlan = buildInitialGeometryPlan({ originalObservation: "A wearable entirely soft fabric hood with a front panel and head strap." });
assert.equal(unsupportedWearablePlan.blocker?.code, "unsupported-profile");
assert.equal(resolveWorkshopStagePresentation({ ...candidate, initialGeometryPlan: unsupportedWearablePlan, conceptGeometryStatus: "unsupported-geometry" }).kind, "visual-concept");
assert.equal(resolveWorkshopStagePresentation(null).kind, "empty");
const viewerSource = readFileSync(resolve(process.cwd(), "app/workshop/Prototype3DViewer.tsx"), "utf8");
const workshopSource = readFileSync(resolve(process.cwd(), "app/workshop/WorkshopRoom.tsx"), "utf8");
assert.equal(viewerSource.match(/<Canvas\b/g)?.length, 1, "Prototype3DViewer must retain one Canvas expression");
assert.equal(workshopSource.match(/<Prototype3DViewer\b/g)?.length, 1, "WorkshopRoom must retain one viewer mount expression");
console.log("Workshop stage presentation fixtures: PASS");
