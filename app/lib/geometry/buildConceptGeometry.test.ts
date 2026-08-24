import assert from "node:assert/strict";

import type { ConceptCandidate, ConceptVisualDesignSnapshot } from "../ai/types";
import { buildConceptGeometry, CONCEPT_GEOMETRY_BUILDER_VERSION } from "./buildConceptGeometry";
import { isValidConceptGeometry } from "./conceptGeometry";
import { buildGeometryFromInitialPlan, buildInitialGeometryPlan, validateInitialGeometryPlan } from "./initialGeometryPlan";

function snapshot(shape: string): ConceptVisualDesignSnapshot {
  return {
    nonAuthoritative: true,
    overallGeometry: [`${shape} sign head mounted on a cylindrical pole`],
    components: ["sign head", "pole", "LED perimeter"],
    materials: ["stainless steel pole", "painted sign head"],
    colours: ["red LEDs around yellow head on stainless steel pole"],
    labels: ["front face reads STOP", "reverse face reads GO"],
    relationships: ["sign head mounted above pole", "LEDs around sign perimeter"],
    movement: ["sign head rotates 180 degrees"],
    proportions: ["overall height 2200 mm", "sign width 520 mm", "sign height 400 mm", "sign depth 64 mm", "pole diameter 68 mm"],
    visualConstraints: [], preservedFeatures: ["red LEDs around yellow head on stainless steel pole"], uncertainties: [],
    componentAttributes: { "sign head": { materials: ["painted surface"], colours: ["yellow"], labels: ["STOP front", "GO reverse"], movement: ["rotates 180 degrees"] }, pole: { materials: ["stainless steel"] }, "LED perimeter": { colours: ["red"] } },
  };
}

const candidate: ConceptCandidate = { candidateId: "candidate-2", conceptFamilyId: "family-1", revision: 2, title: "CONCEPT 02", visualMode: "product", representationStyle: "product-concept", status: "generated", output: { type: "image", mediaType: "image/png", altText: "fixture" }, createdAt: new Date(0).toISOString(), sourceBriefVersion: 1, sourceBriefHash: "fixture", sourceEventIds: [], disclaimer: "fixture" };

const polygon = buildConceptGeometry(candidate, snapshot("octagonal"));
assert.equal(polygon.status, "available");
if (polygon.status === "available") {
  assert.equal(polygon.geometry.builderVersion, CONCEPT_GEOMETRY_BUILDER_VERSION);
  assert.equal(polygon.geometry.components.find(({ id }) => id === "display-head")?.primitive, "extruded-polygon");
  assert.equal(polygon.geometry.components.find(({ id }) => id === "support")?.primitive, "cylinder");
  assert.equal(polygon.geometry.components.find(({ id }) => id === "display-head")?.colour, "#f2cf32");
  assert.equal(polygon.geometry.components.find(({ id }) => id === "support")?.colour, "#aeb8ba");
  assert.equal(polygon.geometry.components.find(({ id }) => id === "support")?.material, "metal");
  assert.equal(polygon.geometry.components.find(({ id }) => id === "display-head")?.markings?.find(({ face }) => face === "front")?.text, "STOP");
  assert.equal(polygon.geometry.components.find(({ id }) => id === "display-head")?.markings?.find(({ face }) => face === "back")?.text, "GO");
  assert.equal(polygon.geometry.components.filter(({ id }) => id.startsWith("edge-light-")).length, 12);
  assert(polygon.geometry.components.filter(({ id }) => id.startsWith("edge-light-")).every(({ colour }) => colour === "#ef3038"));
  assert.equal(polygon.geometry.joints[0]?.maxAngle, 180);
  assert(isValidConceptGeometry(polygon.geometry));
  const crossed = structuredClone(polygon.geometry);
  const head = crossed.components.find(({ id }) => id === "display-head")!;
  head.vertices = [[-100, -100], [100, 100], [-100, 100], [100, -100]];
  assert.equal(isValidConceptGeometry(crossed), false);
}

const rectangular = buildConceptGeometry(candidate, snapshot("rectangular"));
assert.equal(rectangular.status, "available");
if (rectangular.status === "available") assert.equal(rectangular.geometry.components.find(({ id }) => id === "display-head")?.primitive, "box");

const vaguePolygon = buildConceptGeometry(candidate, snapshot("polygonal"));
assert.equal(vaguePolygon.status, "insufficient-data");
const missingDimensions = snapshot("hexagonal");
missingDimensions.proportions = [];
assert.equal(buildConceptGeometry(candidate, missingDimensions).status, "insufficient-data");

const stopGoPlan = buildInitialGeometryPlan({ originalObservation: "I want a portable illuminated STOP/GO traffic sign that one person can operate safely beside the road. It must rotate remotely, remain stable outdoors, be visible in daylight and at night, and last a full work shift." });
assert.equal(stopGoPlan.blocker, undefined);
assert(stopGoPlan.componentIds.includes("base"));
assert(stopGoPlan.componentIds.includes("sign-housing"));
assert(stopGoPlan.componentIds.includes("remote-control"));
assert(stopGoPlan.parameters.some((item) => item.status === "inventor-evidence"));
assert(stopGoPlan.parameters.filter((item) => item.status === "working-assumption").every((item) => item.basis === "rev-portable-signage-profile" && item.inventorConfirmationDesirable));
const planned = buildGeometryFromInitialPlan(candidate, stopGoPlan);
assert(planned.geometry);
if (planned.geometry) {
  assert.equal(planned.geometry.components.find(({ id }) => id === "sign-housing")?.vertices?.length, 24);
  assert.deepEqual(planned.geometry.joints[0]?.axis, [0, 1, 0]);
  assert.equal(planned.geometry.joints[0]?.maxAngle, 180);
  assert.equal(planned.geometry.components.find(({ id }) => id === "lower-pole")?.parentId, "base");
  assert.equal(planned.geometry.components.find(({ id }) => id === "sign-housing")?.parentId, "lower-pole");
  assert.equal(planned.geometry.components.find(({ id }) => id === "wheel-left")?.parentId, "base");
  assert(planned.geometry.components.filter(({ id }) => id.startsWith("perimeter-light-")).every(({ parentId }) => parentId === "sign-housing"));
  assert.deepEqual(planned.geometry.components.find(({ id }) => id === "sign-housing")?.markings?.map(({ face }) => face), ["front", "back"]);
  assert.deepEqual([...stopGoPlan.componentIds].sort(), planned.geometry.components.map(({ id }) => id).sort());
  assert(isValidConceptGeometry(planned.geometry));
}
const unsupportedPlan = buildInitialGeometryPlan({ originalObservation: "A better lawn mower." });
assert.equal(unsupportedPlan.blocker?.code, "unsupported-profile");
for (const input of ["Portable shop sign.", "A fixed traffic light.", "Generic sign.", "Portable box device.", "Gun safe and firearm storage.", "Chemical containment cabinet.", "An illuminated garden product.", "Traffic device for a car park."]) assert.equal(buildInitialGeometryPlan({ originalObservation: input }).blocker?.code, "unsupported-profile", input);
for (const input of ["A portable STOP-GO sign for roadside deployment.", "A MOBILE stop / go traffic-control sign for road workers."]) assert.equal(buildInitialGeometryPlan({ originalObservation: input }).blocker, undefined, input);
assert.equal(validateInitialGeometryPlan({ ...stopGoPlan, parameters: Array.from({ length: 65 }, () => stopGoPlan.parameters[0]) }), false);
assert.equal(validateInitialGeometryPlan({ ...stopGoPlan, componentIds: ["base", "base"] }), false);
assert.equal(validateInitialGeometryPlan({ ...stopGoPlan, parameters: [{ ...stopGoPlan.parameters[0], status: "working-assumption", basis: "accepted-description" }] }), false);
assert.equal(validateInitialGeometryPlan({ ...stopGoPlan, parameters: [{ ...stopGoPlan.parameters[0], label: "x".repeat(121) }] }), false);

console.log("Geometry fidelity fixtures: PASS");
