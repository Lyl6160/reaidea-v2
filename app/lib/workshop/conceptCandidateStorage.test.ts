import assert from "node:assert/strict";

import type { ConceptCandidate } from "../ai/types";
import { isInitialCoreCreationReceipt, isPersistableCandidate } from "./conceptCandidateStorage";
import { buildGeometryFromInitialPlan, buildInitialGeometryPlan } from "../geometry/initialGeometryPlan";

const valid = {
  projectId: "project-fixture", status: "failed", correlationId: "request-fixture", startedAt: "2026-08-24T00:00:00.000Z", updatedAt: "2026-08-24T00:00:01.000Z",
  diagnostic: { correlationId: "request-fixture", category: "provider-failure", httpStatus: 502, providerOperationAttempts: 1, modelIdentifier: "gpt-image-2", occurredAt: "2026-08-24T00:00:01.000Z", retryable: true },
};
assert.equal(isInitialCoreCreationReceipt(valid, "project-fixture"), true);
assert.equal(isInitialCoreCreationReceipt({ ...valid, projectId: "other" }, "project-fixture"), false);
assert.equal(isInitialCoreCreationReceipt({ ...valid, diagnostic: { ...valid.diagnostic, category: "unsafe" } }, "project-fixture"), false);
assert.equal(isInitialCoreCreationReceipt({ ...valid, diagnostic: { ...valid.diagnostic, providerOperationAttempts: "secret" } }, "project-fixture"), false);
const awaitingRepresentation = {
  projectId: "project-fixture",
  status: "awaiting-representation",
  correlationId: "request-routing",
  startedAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:01.000Z",
  representationDiagnostic: {
    mode: "mixed",
    reason: "description-mixed",
    supportingSignalLabels: ["description-physical-form", "description-software"],
    phase: "request-construction",
    category: "representation-question",
  },
};
assert.equal(isInitialCoreCreationReceipt(awaitingRepresentation, "project-fixture"), true);
assert.equal(isInitialCoreCreationReceipt({ ...awaitingRepresentation, submittedText: "raw inventor text" }, "project-fixture"), false);
assert.equal(isInitialCoreCreationReceipt({ ...awaitingRepresentation, representationDiagnostic: { ...awaitingRepresentation.representationDiagnostic, supportingSignalLabels: ["raw inventor text"] } }, "project-fixture"), false);
assert.equal(isInitialCoreCreationReceipt({ ...awaitingRepresentation, diagnostic: valid.diagnostic }, "project-fixture"), false);
assert.equal(isInitialCoreCreationReceipt({ projectId: "project-fixture", status: "creating", correlationId: "legacy", startedAt: "2026-08-24T00:00:00.000Z", updatedAt: "2026-08-24T00:00:01.000Z" }, "project-fixture"), true);

const candidate: ConceptCandidate = { candidateId: "candidate-fixture", conceptFamilyId: "family-fixture", revision: 1, title: "Fixture", visualMode: "product", representationStyle: "product-concept", status: "generated", createdAt: new Date(0).toISOString(), sourceBriefVersion: 1, sourceBriefHash: "fixture", sourceEventIds: [], output: { type: "image", dataUrl: "data:image/png;base64,AA==", mediaType: "image/png", altText: "fixture" }, disclaimer: "fixture" };
assert.equal(isPersistableCandidate(candidate), true); // Legacy candidates remain readable.
const plan = buildInitialGeometryPlan({ originalObservation: "A portable illuminated STOP/GO traffic sign with remote operation, stable outdoor support, and full-shift power." });
const built = buildGeometryFromInitialPlan(candidate, plan);
assert(built.geometry);
if (built.geometry) {
  const enriched = { ...candidate, initialGeometryPlan: plan, conceptGeometry: built.geometry, conceptGeometryStatus: "available" as const };
  assert.equal(isPersistableCandidate(enriched), true);
  assert.equal(isPersistableCandidate({ ...enriched, conceptGeometry: { ...built.geometry, source: { ...built.geometry.source!, candidateId: "other-candidate" } } }), false);
  assert.equal(isPersistableCandidate({ ...enriched, initialGeometryPlan: { ...plan, componentIds: ["BAD ID"] } }), false);
  assert.equal(isPersistableCandidate({ ...enriched, initialGeometryPlan: { ...plan, componentIds: plan.componentIds.filter((id) => id !== "base") } }), false);
  assert.equal(isPersistableCandidate({ ...enriched, conceptGeometry: { ...built.geometry, components: [] } }), false);
}
console.log("Initial Core Creation receipt fixtures: PASS");
