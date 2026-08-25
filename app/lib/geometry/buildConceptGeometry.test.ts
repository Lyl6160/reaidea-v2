import assert from "node:assert/strict";

import type { ConceptCandidate, ConceptVisualDesignSnapshot } from "../ai/types";
import { buildConceptGeometry, CONCEPT_GEOMETRY_BUILDER_VERSION } from "./buildConceptGeometry";
import { isValidConceptGeometry, type ConceptGeometryComponent, type GeometryVector3 } from "./conceptGeometry";
import { buildGeometryFromInitialPlan, buildInitialGeometryPlan, validateInitialGeometryPlan } from "./initialGeometryPlan";

function componentBounds(components: ConceptGeometryComponent[], id: string) {
  const component = components.find((item) => item.id === id);
  assert(component, `Missing ${id}`);
  const worldPosition = (item: ConceptGeometryComponent): GeometryVector3 => {
    if (!item.parentId) return [item.position[0], item.position[1], item.position[2]];
    const parent = components.find((candidate) => candidate.id === item.parentId);
    assert(parent, `Missing parent for ${item.id}`);
    const [x, y, z] = worldPosition(parent);
    return [x + item.position[0], y + item.position[1], z + item.position[2]];
  };
  const [x, y, z] = worldPosition(component);
  if (component.primitive === "cylinder") {
    const [rx, , rz] = component.rotation;
    const axisAlongX = Math.abs(Math.abs(rz) - 90) < 0.001;
    const axisAlongZ = Math.abs(Math.abs(rx) - 90) < 0.001;
    assert.notEqual(component.dimensions.radius, undefined, `${id} needs a radius`);
    assert.notEqual(component.dimensions.height, undefined, `${id} needs a height`);
    const radius = component.dimensions.radius!;
    const height = component.dimensions.height!;
    const halfHeight = height / 2;
    return {
      min: [x - (axisAlongX ? halfHeight : radius), y - (axisAlongX || axisAlongZ ? radius : halfHeight), z - (axisAlongZ ? halfHeight : radius)],
      max: [x + (axisAlongX ? halfHeight : radius), y + (axisAlongX || axisAlongZ ? radius : halfHeight), z + (axisAlongZ ? halfHeight : radius)],
      centre: [x, y, z],
    };
  }
  if (component.primitive === "sphere") {
    assert.notEqual(component.dimensions.radius, undefined, `${id} needs a radius`);
    const radius = component.dimensions.radius!;
    return { min: [x - radius, y - radius, z - radius], max: [x + radius, y + radius, z + radius], centre: [x, y, z] };
  }
  if (component.primitive === "extruded-polygon") {
    assert(component.vertices?.length, `${id} needs vertices`);
    assert.notEqual(component.dimensions.depth, undefined, `${id} needs a depth`);
    const xs = component.vertices.map(([vertexX]) => vertexX);
    const ys = component.vertices.map(([, vertexY]) => vertexY);
    const halfDepth = component.dimensions.depth! / 2;
    return { min: [x + Math.min(...xs), y + Math.min(...ys), z - halfDepth], max: [x + Math.max(...xs), y + Math.max(...ys), z + halfDepth], centre: [x, y, z] };
  }
  const dimensions = component.dimensions;
  assert.notEqual(dimensions.x, undefined, `${id} needs an x dimension`);
  assert.notEqual(dimensions.y, undefined, `${id} needs a y dimension`);
  assert.notEqual(dimensions.z, undefined, `${id} needs a z dimension`);
  const halfX = dimensions.x! / 2;
  const halfY = dimensions.y! / 2;
  const halfZ = dimensions.z! / 2;
  const yRotation = (component.rotation[1] * Math.PI) / 180;
  const extentX = Math.abs(Math.cos(yRotation)) * halfX + Math.abs(Math.sin(yRotation)) * halfZ;
  const extentZ = Math.abs(Math.sin(yRotation)) * halfX + Math.abs(Math.cos(yRotation)) * halfZ;
  return { min: [x - extentX, y - halfY, z - extentZ], max: [x + extentX, y + halfY, z + extentZ], centre: [x, y, z] };
}

function worldPosition(components: ConceptGeometryComponent[], id: string): GeometryVector3 {
  const component = components.find((item) => item.id === id);
  assert(component, `Missing ${id}`);
  if (!component.parentId) return component.position;
  const parent = worldPosition(components, component.parentId);
  return [parent[0] + component.position[0], parent[1] + component.position[1], parent[2] + component.position[2]];
}

function beamEndpoints(components: ConceptGeometryComponent[], id: string) {
  const component = components.find((item) => item.id === id);
  assert(component, `Missing ${id}`);
  assert.equal(component.primitive, "box", `${id} must be a beam`);
  assert.notEqual(component.dimensions.x, undefined, `${id} needs a beam length`);
  const [x, y, z] = worldPosition(components, id);
  const angle = (component.rotation[1] * Math.PI) / 180;
  const halfLength = component.dimensions.x! / 2;
  const dx = Math.cos(angle) * halfLength;
  const dz = -Math.sin(angle) * halfLength;
  return { first: [x - dx, y, z - dz] as GeometryVector3, second: [x + dx, y, z + dz] as GeometryVector3 };
}

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
  const geometry = planned.geometry;
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
  const baseBounds = componentBounds(planned.geometry.components, "base");
  const leftWheel = componentBounds(planned.geometry.components, "wheel-left");
  const rightWheel = componentBounds(planned.geometry.components, "wheel-right");
  assert(leftWheel.max[0] >= baseBounds.min[0], "Left wheel inner mounting face must meet the base");
  assert(rightWheel.min[0] <= baseBounds.max[0], "Right wheel inner mounting face must meet the base");
  assert(leftWheel.min[0] < baseBounds.min[0], "Left wheel outer face must remain outside the base");
  assert(rightWheel.max[0] > baseBounds.max[0], "Right wheel outer face must remain outside the base");
  assert.equal(leftWheel.min[1], 0, "Wheel must meet the working ground plane");
  assert.equal(rightWheel.min[1], 0, "Wheel must meet the working ground plane");
  assert.equal(geometry.components.find(({ id }) => id === "wheel-hub-left")?.parentId, "wheel-left");
  assert.equal(geometry.components.find(({ id }) => id === "wheel-hub-right")?.parentId, "wheel-right");
  const stabilisers = ["stabiliser-front-left", "stabiliser-front-right", "stabiliser-rear-left", "stabiliser-rear-right"] as const;
  const feet = ["stabiliser-foot-front-left", "stabiliser-foot-front-right", "stabiliser-foot-rear-left", "stabiliser-foot-rear-right"] as const;
  const innerMounts: string[] = [];
  const outerFeet: string[] = [];
  stabilisers.forEach((id, index) => {
    const stabiliser = componentBounds(geometry.components, id);
    const foot = componentBounds(geometry.components, feet[index]);
    const endpoints = beamEndpoints(geometry.components, id);
    const [inner, outer] = [endpoints.first, endpoints.second].sort((left, right) => Math.hypot(left[0], left[2]) - Math.hypot(right[0], right[2]));
    assert(stabiliser.min[1] <= baseBounds.max[1] && stabiliser.max[1] >= baseBounds.min[1], `${id} must overlap the lower base mounting region`);
    assert(Math.abs(Math.abs(inner[0]) - baseBounds.max[0]) <= 5 && Math.abs(inner[2]) < baseBounds.max[2], `${id} inner endpoint must meet a base corner mount`);
    assert(Math.abs(outer[0] - foot.centre[0]) <= 2 && Math.abs(outer[2] - foot.centre[2]) <= 2, `${id} outer endpoint must meet its foot`);
    assert(foot.min[1] === 0 && foot.max[1] >= stabiliser.min[1], `${id} foot must ground and overlap the beam`);
    assert(stabiliser.min[0] < baseBounds.min[0] || stabiliser.max[0] > baseBounds.max[0], `${id} must extend beyond the base width`);
    assert(stabiliser.min[2] < baseBounds.min[2] || stabiliser.max[2] > baseBounds.max[2], `${id} must extend beyond the base depth`);
    innerMounts.push(`${Math.round(inner[0])},${Math.round(inner[2])}`);
    outerFeet.push(`${Math.round(outer[0])},${Math.round(outer[2])}`);
  });
  assert.equal(new Set(innerMounts).size, 4, "Stabiliser inner mounts must be distinct");
  assert.equal(new Set(outerFeet).size, 4, "Stabiliser outer feet must be distinct");
  const lowerPole = componentBounds(planned.geometry.components, "lower-pole");
  const housing = componentBounds(planned.geometry.components, "sign-housing");
  assert.equal(lowerPole.min[1], baseBounds.max[1], "Lower pole must begin on the base top");
  assert.equal(housing.min[1], lowerPole.max[1], "Housing must begin at the selected pole top");
  const lights = geometry.components.filter(({ id }) => id.startsWith("perimeter-light-"));
  assert(lights.every((light) => componentBounds(geometry.components, light.id).max[2] > housing.max[2]), "Perimeter lights must sit outside the housing face");
  const independentlyPlaced = planned.geometry.components.filter(({ id }) => !id.startsWith("wheel-hub-"));
  assert.equal(new Set(independentlyPlaced.map(({ id }) => worldPosition(geometry.components, id).join(","))).size, independentlyPlaced.length, "Expected independently placed components to retain distinct useful world transforms");
}
const telescopingStopGoPlan = buildInitialGeometryPlan({ originalObservation: "I need a portable illuminated STOP/GO traffic sign for roadside workers with a height-adjustable telescoping pole, remote control, outdoor stability and full-shift power." });
const telescopingGeometry = buildGeometryFromInitialPlan(candidate, telescopingStopGoPlan);
assert(telescopingGeometry.geometry);
if (telescopingGeometry.geometry) {
  const telescopingBase = componentBounds(telescopingGeometry.geometry.components, "base");
  const lowerPole = componentBounds(telescopingGeometry.geometry.components, "lower-pole");
  const upperPole = componentBounds(telescopingGeometry.geometry.components, "upper-pole");
  const housing = componentBounds(telescopingGeometry.geometry.components, "sign-housing");
  assert.equal(lowerPole.min[1], telescopingBase.max[1], "Lower pole must meet the base with upper pole enabled");
  assert.equal(upperPole.min[1], lowerPole.max[1], "Upper pole must begin at lower pole top");
  assert.equal(housing.min[1], upperPole.max[1], "Housing must begin at upper pole top");
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
