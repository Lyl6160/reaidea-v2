export type GeometryVector3 = readonly [number, number, number];
export type GeometryPoint2 = readonly [number, number];

export type ConceptGeometryPrimitive = "box" | "cylinder" | "sphere" | "plane" | "extruded-polygon";
export type ConceptGeometryMaterial = "matte" | "plastic" | "metal" | "emissive";
export type ConceptGeometryFace = "front" | "back" | "left" | "right" | "top" | "bottom";

export type ConceptGeometryMarking = {
  face: ConceptGeometryFace;
  text: string;
  fontSize: number;
  foreground: string;
  background: string;
};

export type ConceptGeometryComponent = {
  id: string;
  primitive: ConceptGeometryPrimitive;
  dimensions: {
    x?: number;
    y?: number;
    z?: number;
    radius?: number;
    height?: number;
    depth?: number;
  };
  vertices?: GeometryPoint2[];
  position: GeometryVector3;
  rotation: GeometryVector3;
  scale?: GeometryVector3;
  colour: string;
  material: ConceptGeometryMaterial;
  parentId?: string;
  markings?: ConceptGeometryMarking[];
};

export type ConceptGeometryJoint = {
  id: string;
  type: "revolute";
  parentId: string;
  childId: string;
  pivot: GeometryVector3;
  axis: GeometryVector3;
  defaultAngle: number;
  minAngle: number;
  maxAngle: number;
};

export type ConceptGeometry = {
  schemaVersion: 1;
  nonAuthoritative: true;
  units: "mm";
  eligibility: "physical-product" | "machine";
  status: "proof" | "draft";
  builderVersion?: number;
  source?: {
    conceptFamilyId: string;
    candidateId: string;
    revision: number;
  };
  overallBounds: { x: number; y: number; z: number };
  components: ConceptGeometryComponent[];
  joints: ConceptGeometryJoint[];
};

const MAX_COMPONENTS = 64;
const MAX_JOINTS = 16;
const MAX_DIMENSION_MM = 100_000;
const MAX_POSITION_MM = 200_000;
const MAX_MARKINGS_PER_COMPONENT = 4;
const MAX_MARKING_LENGTH = 24;
const ID_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;
const COLOUR_PATTERN = /^#[0-9a-f]{6}$/i;
const PRIMITIVES = new Set<ConceptGeometryPrimitive>(["box", "cylinder", "sphere", "plane", "extruded-polygon"]);
const MATERIALS = new Set<ConceptGeometryMaterial>(["matte", "plastic", "metal", "emissive"]);
const FACES = new Set<ConceptGeometryFace>(["front", "back", "left", "right", "top", "bottom"]);

export function isValidConceptGeometry(value: unknown): value is ConceptGeometry {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.nonAuthoritative !== true || value.units !== "mm") return false;
  if (!["physical-product", "machine"].includes(String(value.eligibility)) || !["proof", "draft"].includes(String(value.status))) return false;
  if (!isBounds(value.overallBounds) || !Array.isArray(value.components) || value.components.length < 1 || value.components.length > MAX_COMPONENTS) return false;
  if (!Array.isArray(value.joints) || value.joints.length > MAX_JOINTS) return false;
  if (value.source !== undefined && (!isRecord(value.source) ||
    typeof value.source.conceptFamilyId !== "string" || !value.source.conceptFamilyId.trim() ||
    typeof value.source.candidateId !== "string" || !value.source.candidateId.trim() ||
    !Number.isInteger(value.source.revision) || Number(value.source.revision) < 1)) return false;
  if (value.builderVersion !== undefined && (!Number.isInteger(value.builderVersion) || Number(value.builderVersion) < 1 || Number(value.builderVersion) > 1000)) return false;

  const componentIds = new Set<string>();
  for (const component of value.components) {
    if (!isComponent(component) || componentIds.has(component.id)) return false;
    componentIds.add(component.id);
  }
  for (const component of value.components) {
    if (component.parentId && (!componentIds.has(component.parentId) || component.parentId === component.id)) return false;
  }
  if (hasHierarchyCycle(value.components)) return false;

  const jointIds = new Set<string>();
  const jointChildren = new Set<string>();
  for (const joint of value.joints) {
    if (!isJoint(joint) || jointIds.has(joint.id) || jointChildren.has(joint.childId)) return false;
    if (!componentIds.has(joint.parentId) || !componentIds.has(joint.childId) || joint.parentId === joint.childId) return false;
    const child = value.components.find((component) => component.id === joint.childId);
    if (!child || child.parentId !== joint.parentId) return false;
    jointIds.add(joint.id);
    jointChildren.add(joint.childId);
  }
  return true;
}

export function assertConceptGeometry(value: unknown): asserts value is ConceptGeometry {
  if (!isValidConceptGeometry(value)) throw new Error("Concept geometry is invalid or outside supported bounds.");
}

function isComponent(value: unknown): value is ConceptGeometryComponent {
  if (!isRecord(value) || typeof value.id !== "string" || !ID_PATTERN.test(value.id)) return false;
  if (!PRIMITIVES.has(value.primitive as ConceptGeometryPrimitive) || !MATERIALS.has(value.material as ConceptGeometryMaterial)) return false;
  if (typeof value.colour !== "string" || !COLOUR_PATTERN.test(value.colour) || !isVector(value.position, MAX_POSITION_MM, true) || !isVector(value.rotation, 360, true)) return false;
  if (value.scale !== undefined && (!isVector(value.scale, 100, false) || value.scale.some((part) => part <= 0))) return false;
  if (value.parentId !== undefined && (typeof value.parentId !== "string" || !ID_PATTERN.test(value.parentId))) return false;
  if (!isDimensions(value.primitive as ConceptGeometryPrimitive, value.dimensions)) return false;
  if (value.primitive === "extruded-polygon") {
    if (!isValidPolygon(value.vertices)) return false;
  } else if (value.vertices !== undefined) return false;
  if (value.markings !== undefined) {
    if (!["box", "plane", "extruded-polygon"].includes(String(value.primitive))) return false;
    if (!Array.isArray(value.markings) || value.markings.length > MAX_MARKINGS_PER_COMPONENT || !value.markings.every(isMarking)) return false;
  }
  return true;
}

function isDimensions(primitive: ConceptGeometryPrimitive, value: unknown): boolean {
  if (!isRecord(value)) return false;
  const positive = (part: unknown) => finiteNumber(part) && part > 0 && part <= MAX_DIMENSION_MM;
  if (primitive === "box") return positive(value.x) && positive(value.y) && positive(value.z);
  if (primitive === "cylinder") return positive(value.radius) && positive(value.height);
  if (primitive === "sphere") return positive(value.radius);
  if (primitive === "extruded-polygon") return positive(value.depth);
  return positive(value.x) && positive(value.y);
}

function isValidPolygon(value: unknown): value is GeometryPoint2[] {
  if (!Array.isArray(value) || value.length < 3 || value.length > 16) return false;
  if (!value.every((point) => Array.isArray(point) && point.length === 2 && point.every((part) => finiteNumber(part) && Math.abs(part) <= MAX_DIMENSION_MM))) return false;
  const vertices = value as GeometryPoint2[];
  if (vertices.some((point, index) => samePoint(point, vertices[(index + 1) % vertices.length]))) return false;
  if (Math.abs(signedArea(vertices)) < 1) return false;
  for (let left = 0; left < vertices.length; left += 1) {
    const leftNext = (left + 1) % vertices.length;
    for (let right = left + 1; right < vertices.length; right += 1) {
      const rightNext = (right + 1) % vertices.length;
      if (left === right || leftNext === right || rightNext === left) continue;
      if (segmentsIntersect(vertices[left], vertices[leftNext], vertices[right], vertices[rightNext])) return false;
    }
  }
  return true;
}

function signedArea(vertices: GeometryPoint2[]): number { return vertices.reduce((sum, [x, y], index) => { const next = vertices[(index + 1) % vertices.length]; return sum + x * next[1] - next[0] * y; }, 0) / 2; }
function samePoint(left: GeometryPoint2, right: GeometryPoint2): boolean { return left[0] === right[0] && left[1] === right[1]; }
function segmentsIntersect(a: GeometryPoint2, b: GeometryPoint2, c: GeometryPoint2, d: GeometryPoint2): boolean {
  const cross = (p: GeometryPoint2, q: GeometryPoint2, r: GeometryPoint2) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const abC = cross(a, b, c); const abD = cross(a, b, d); const cdA = cross(c, d, a); const cdB = cross(c, d, b);
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
}

function isMarking(value: unknown): value is ConceptGeometryMarking {
  return isRecord(value) && FACES.has(value.face as ConceptGeometryFace) &&
    typeof value.text === "string" && value.text.trim().length > 0 && value.text.length <= MAX_MARKING_LENGTH &&
    finiteNumber(value.fontSize) && value.fontSize >= 8 && value.fontSize <= 128 &&
    typeof value.foreground === "string" && COLOUR_PATTERN.test(value.foreground) &&
    typeof value.background === "string" && COLOUR_PATTERN.test(value.background);
}

function isJoint(value: unknown): value is ConceptGeometryJoint {
  if (!isRecord(value) || typeof value.id !== "string" || !ID_PATTERN.test(value.id) || value.type !== "revolute") return false;
  if (typeof value.parentId !== "string" || !ID_PATTERN.test(value.parentId) || typeof value.childId !== "string" || !ID_PATTERN.test(value.childId)) return false;
  if (!isVector(value.pivot, MAX_POSITION_MM, true) || !isVector(value.axis, 1, true)) return false;
  const axisLength = Math.hypot(...value.axis);
  if (axisLength < 0.999 || axisLength > 1.001) return false;
  const defaultAngle = value.defaultAngle;
  const minAngle = value.minAngle;
  const maxAngle = value.maxAngle;
  if (![defaultAngle, minAngle, maxAngle].every((angle) => finiteNumber(angle) && angle >= -360 && angle <= 360)) return false;
  return finiteNumber(minAngle) && finiteNumber(defaultAngle) && finiteNumber(maxAngle) && minAngle <= defaultAngle && defaultAngle <= maxAngle;
}

function isBounds(value: unknown): boolean {
  return isRecord(value) && [value.x, value.y, value.z].every((part) => finiteNumber(part) && part > 0 && part <= MAX_DIMENSION_MM);
}

function isVector(value: unknown, absoluteLimit: number, allowZero: boolean): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every((part) =>
    finiteNumber(part) && Math.abs(part) <= absoluteLimit && (allowZero || part !== 0)
  );
}

function hasHierarchyCycle(components: ConceptGeometryComponent[]): boolean {
  const parents = new Map(components.map((component) => [component.id, component.parentId]));
  for (const component of components) {
    const visited = new Set<string>();
    let current: string | undefined = component.id;
    while (current) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = parents.get(current);
    }
  }
  return false;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
