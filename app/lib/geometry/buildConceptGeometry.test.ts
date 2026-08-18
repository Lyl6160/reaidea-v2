import assert from "node:assert/strict";

import type { ConceptCandidate, ConceptVisualDesignSnapshot } from "../ai/types";
import { buildConceptGeometry, CONCEPT_GEOMETRY_BUILDER_VERSION } from "./buildConceptGeometry";
import { isValidConceptGeometry } from "./conceptGeometry";

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

console.log("Geometry fidelity fixtures: PASS");
