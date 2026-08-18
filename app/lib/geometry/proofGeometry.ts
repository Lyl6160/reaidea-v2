import { assertConceptGeometry, type ConceptGeometry } from "./conceptGeometry";

const perimeterPoints = [
  [-210, 150], [-105, 185], [0, 195], [105, 185], [210, 150],
  [238, 55], [238, -55], [210, -150], [105, -185], [0, -195],
  [-105, -185], [-210, -150], [-238, -55], [-238, 55],
] as const;

export const PROTOTYPE_PROOF_GEOMETRY: ConceptGeometry = {
  schemaVersion: 1,
  nonAuthoritative: true,
  units: "mm",
  eligibility: "physical-product",
  status: "proof",
  overallBounds: { x: 560, y: 2400, z: 240 },
  components: [
    { id: "base", primitive: "cylinder", dimensions: { radius: 150, height: 70 }, position: [0, 35, 0], rotation: [0, 0, 0], colour: "#343b3e", material: "metal" },
    { id: "pole", primitive: "cylinder", dimensions: { radius: 34, height: 1800 }, position: [0, 935, 0], rotation: [0, 0, 0], colour: "#aab3b5", material: "metal" },
    { id: "sign-head", primitive: "box", dimensions: { x: 500, y: 400, z: 64 }, position: [0, 900, 0], rotation: [0, 0, 0], colour: "#b5252a", material: "plastic", parentId: "pole", markings: [
      { face: "front", text: "STOP", fontSize: 70, foreground: "#ffffff", background: "#b5252a" },
      { face: "back", text: "GO", fontSize: 82, foreground: "#ffffff", background: "#248447" },
    ] },
    { id: "frame-top", primitive: "box", dimensions: { x: 540, y: 24, z: 78 }, position: [0, 212, 0], rotation: [0, 0, 0], colour: "#252b2d", material: "metal", parentId: "sign-head" },
    { id: "frame-bottom", primitive: "box", dimensions: { x: 540, y: 24, z: 78 }, position: [0, -212, 0], rotation: [0, 0, 0], colour: "#252b2d", material: "metal", parentId: "sign-head" },
    { id: "frame-left", primitive: "box", dimensions: { x: 24, y: 400, z: 78 }, position: [-258, 0, 0], rotation: [0, 0, 0], colour: "#252b2d", material: "metal", parentId: "sign-head" },
    { id: "frame-right", primitive: "box", dimensions: { x: 24, y: 400, z: 78 }, position: [258, 0, 0], rotation: [0, 0, 0], colour: "#252b2d", material: "metal", parentId: "sign-head" },
    ...perimeterPoints.map(([x, y], index) => ({
      id: `perimeter-light-${index + 1}`,
      primitive: "sphere" as const,
      dimensions: { radius: 14 },
      position: [x, y, 46] as const,
      rotation: [0, 0, 0] as const,
      colour: "#ff3038",
      material: "emissive" as const,
      parentId: "sign-head",
    })),
  ],
  joints: [{
    id: "head-turn",
    type: "revolute",
    parentId: "pole",
    childId: "sign-head",
    pivot: [0, 900, 0],
    axis: [0, 1, 0],
    defaultAngle: 0,
    minAngle: 0,
    maxAngle: 180,
  }],
};

assertConceptGeometry(PROTOTYPE_PROOF_GEOMETRY);
