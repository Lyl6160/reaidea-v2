import assert from "node:assert/strict";

import type { ConceptGeometryComponent, ConceptGeometryJoint } from "./conceptGeometry";
import { resolveComponentTransform } from "./componentTransforms";

const base: ConceptGeometryComponent = { id: "base", primitive: "box", dimensions: { x: 1, y: 1, z: 1 }, position: [12, 34, 56], rotation: [0, 0, 0], colour: "#000000", material: "matte" };
assert.deepEqual(resolveComponentTransform(base), { containerPosition: [0, 0, 0], localPosition: [12, 34, 56] });
const head: ConceptGeometryComponent = { ...base, id: "head", parentId: "base", position: [0, 595, 0] };
const joint: ConceptGeometryJoint = { id: "head-turn", type: "revolute", parentId: "base", childId: "head", pivot: [0, 595, 0], axis: [0, 1, 0], defaultAngle: 0, minAngle: 0, maxAngle: 180 };
assert.deepEqual(resolveComponentTransform(head, joint), { containerPosition: [0, 595, 0], localPosition: [0, 0, 0] });
console.log("Geometry component transform fixtures: PASS");
