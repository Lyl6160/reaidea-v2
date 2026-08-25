import type { ConceptCandidate, InitialGeometryBlocker, InitialGeometryDatum, InitialGeometryPlan, VisualUnderstandingResult } from "../ai/types";
import type { Project } from "../core/project";
import { assertConceptGeometry, type ConceptGeometry, type ConceptGeometryComponent, type GeometryPoint2 } from "./conceptGeometry";

const PROFILE = "portable-signage" as const;
const MAX_PARAMETERS = 64;
const MAX_COMPONENT_IDS = 64;
const ID_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;
const BLOCKED: InitialGeometryBlocker = { code: "unsupported-profile", safeMessage: "REV cannot yet form a supported initial geometry profile from this invention." };
const datumKeys = ["id", "label", "value", "unit", "status", "basis", "blocksGeometry", "inventorConfirmationDesirable"];
const planKeys = ["version", "nonAuthoritative", "profile", "parameters", "componentIds", "blocker"];

export function buildInitialGeometryPlan(project: Pick<Project, "originalObservation">, interpretation?: VisualUnderstandingResult): InitialGeometryPlan {
  const text = normalize(project.originalObservation);
  const trafficControl = /\b(stop\s*\/?\s*go|traffic[-\s]control\s+sign|traffic\s+sign\s+(?:intended\s+to\s+)?direct\s+road\s+users|road[-\s]worker\s+traffic\s+control|reversible\s+traffic[-\s]control\s+face)\b/.test(text);
  const portableOperation = /\b(portable|mobile|one[-\s]person\s+operation|transport(?:ed|able)?\s+between\s+work\s+locations|roadside\s+deployment|wheeled\s+deployment|carried\s+deployment)\b/.test(text);
  if (!trafficControl || !portableOperation) return blockedPlan();
  const evidence = (id: string, label: string, value: boolean): InitialGeometryDatum => ({ id, label, value, status: "inventor-evidence", basis: "accepted-description", blocksGeometry: false, inventorConfirmationDesirable: false });
  const assumption = (id: string, label: string, value: string | number | boolean, unit?: "mm" | "degrees" | "count"): InitialGeometryDatum => ({ id, label, value, ...(unit ? { unit } : {}), status: "working-assumption", basis: "rev-portable-signage-profile", blocksGeometry: false, inventorConfirmationDesirable: true });
  const illuminated = /\b(illuminat\w*|daylight|night|visible)\b/.test(text);
  const mobile = /\b(portable|mobile|transport|wheeled\s+deployment|carried\s+deployment)\b/.test(text);
  const stable = /\b(?:stabil\w*|outdoor\w*)\b/.test(text);
  const telescoping = /\b(adjust\w*|telescop\w*|height)\b/.test(text);
  const remote = /\b(remote|remotely|control)\b/.test(text);
  const parameters = [
    evidence("portable-operation", "Portable operation", mobile), evidence("traffic-control-signage", "Traffic-control signage", true), evidence("outdoor-stability", "Outdoor stability", stable), evidence("remote-operation", "Remote operation", remote),
    assumption("base-width", "Base width", 720, "mm"), assumption("base-depth", "Base depth", 500, "mm"), assumption("base-height", "Base height", 230, "mm"), assumption("wheel-radius", "Wheel radius", 135, "mm"), assumption("stabiliser-reach", "Stabiliser reach", 760, "mm"), assumption("lower-pole-height", "Lower pole height", 800, "mm"), assumption("upper-pole-height", "Upper pole height", 300, "mm"), assumption("housing-diameter", "Circular housing diameter", 560, "mm"), assumption("housing-depth", "Circular housing depth", 70, "mm"), assumption("perimeter-light-count", "Perimeter light modules", 14, "count"), assumption("remote-height", "Remote height", 145, "mm"), assumption("remote-width", "Remote width", 60, "mm"), assumption("remote-depth", "Remote depth", 20, "mm"), assumption("sign-rotation", "Sign-head rotation", 180, "degrees"),
    assumption("base-material", "Base enclosure material and finish", "dark metal enclosure"), assumption("pole-material", "Pole material", "metal"), assumption("housing-material", "Sign-housing material", "dark metal"), assumption("stabiliser-material", "Stabiliser material", "metal"), assumption("wheel-material", "Wheel material", "matte black"), assumption("stop-colour", "STOP working colour", "red"), assumption("go-colour", "GO working colour", "green"), assumption("perimeter-light-representation", "Perimeter-light representation", "warm-gold emissive modules"),
  ];
  if (interpretation) parameters.push({ id: "cleared-reference", label: "Cleared reference interpretation available", value: true, status: "interpreted", basis: "cleared-image-interpretation", blocksGeometry: false, inventorConfirmationDesirable: false });
  const componentIds = ["base", ...(mobile ? ["wheel-left", "wheel-right", "wheel-hub-left", "wheel-hub-right"] : []), ...(stable ? ["stabiliser-front-left", "stabiliser-front-right", "stabiliser-rear-left", "stabiliser-rear-right", "stabiliser-foot-front-left", "stabiliser-foot-front-right", "stabiliser-foot-rear-left", "stabiliser-foot-rear-right"] : []), "lower-pole", ...(telescoping ? ["upper-pole"] : []), "sign-housing", ...(illuminated ? Array.from({ length: 14 }, (_, index) => `perimeter-light-${index + 1}`) : []), ...(remote ? ["remote-holder", "remote-control"] : [])];
  return { version: 1, nonAuthoritative: true, profile: PROFILE, parameters, componentIds };
}

export function buildGeometryFromInitialPlan(candidate: ConceptCandidate, plan: InitialGeometryPlan): { geometry?: ConceptGeometry; blocker?: InitialGeometryBlocker } {
  if (!validateInitialGeometryPlan(plan)) return { blocker: invalidPlan() };
  if (plan.blocker) return { blocker: plan.blocker };
  const includes = (id: string) => plan.componentIds.includes(id);
  const signParent = includes("upper-pole") ? "upper-pole" : "lower-pole";
  const signPosition: [number, number, number] = includes("upper-pole") ? [0, 430, 0] : [0, 680, 0];
  const components: ConceptGeometryComponent[] = [{ id: "base", primitive: "box", dimensions: { x: 720, y: 230, z: 500 }, position: [0, 240, 0], rotation: [0, 0, 0], colour: "#355260", material: "metal" }];
  // Child offsets are local to the base centre. Wheels clear the 720 mm side bounds;
  // stabiliser feet meet the same working ground plane and deliberately extend beyond each corner.
  // Wheels use the front/rear axle and overlap the base mounting face by 5 mm.
  if (includes("wheel-left")) components.push({ id: "wheel-left", primitive: "cylinder", dimensions: { radius: 135, height: 48 }, position: [-490, -105, 0], rotation: [90, 0, 0], colour: "#252b2e", material: "matte", parentId: "base" });
  if (includes("wheel-right")) components.push({ id: "wheel-right", primitive: "cylinder", dimensions: { radius: 135, height: 48 }, position: [490, -105, 0], rotation: [90, 0, 0], colour: "#252b2e", material: "matte", parentId: "base" });
  if (includes("wheel-hub-left")) components.push({ id: "wheel-hub-left", primitive: "cylinder", dimensions: { radius: 58, height: 52 }, position: [0, 0, 0], rotation: [0, 0, 0], colour: "#b7c6cb", material: "metal", parentId: "wheel-left" });
  if (includes("wheel-hub-right")) components.push({ id: "wheel-hub-right", primitive: "cylinder", dimensions: { radius: 58, height: 52 }, position: [0, 0, 0], rotation: [0, 0, 0], colour: "#b7c6cb", material: "metal", parentId: "wheel-right" });
  // Each raised beam overlaps one lower base corner, then meets a vertical foot at y=0.
  const legs = [[-550, -90, -300, -35], [550, -90, -300, 35], [-550, -90, 300, 35], [550, -90, 300, -35]] as const;
  legs.forEach(([x, y, z, angle], index) => { const id = ["stabiliser-front-left", "stabiliser-front-right", "stabiliser-rear-left", "stabiliser-rear-right"][index]; if (includes(id)) components.push({ id, primitive: "box", dimensions: { x: 460, y: 60, z: 72 }, position: [x, y, z], rotation: [0, angle, 0], colour: "#aeb8ba", material: "metal", parentId: "base" }); });
  const feet = [[-738, -165, -432], [738, -165, -432], [-738, -165, 432], [738, -165, 432]] as const;
  feet.forEach(([x, y, z], index) => { const id = ["stabiliser-foot-front-left", "stabiliser-foot-front-right", "stabiliser-foot-rear-left", "stabiliser-foot-rear-right"][index]; if (includes(id)) components.push({ id, primitive: "cylinder", dimensions: { radius: 60, height: 150 }, position: [x, y, z], rotation: [0, 0, 0], colour: "#c6d2d5", material: "metal", parentId: "base" }); });
  components.push({ id: "lower-pole", primitive: "cylinder", dimensions: { radius: 38, height: 800 }, position: [0, 515, 0], rotation: [0, 0, 0], colour: "#aeb8ba", material: "metal", parentId: "base" });
  if (includes("upper-pole")) components.push({ id: "upper-pole", primitive: "cylinder", dimensions: { radius: 30, height: 300 }, position: [0, 550, 0], rotation: [0, 0, 0], colour: "#aeb8ba", material: "metal", parentId: "lower-pole" });
  components.push({ id: "sign-housing", primitive: "extruded-polygon", dimensions: { depth: 70 }, vertices: regularPolygon(24, 560), position: signPosition, rotation: [0, 0, 0], colour: "#202426", material: "metal", parentId: signParent, markings: [{ face: "front", text: "STOP", fontSize: 70, foreground: "#ffffff", background: "#ef3038" }, { face: "back", text: "GO", fontSize: 86, foreground: "#ffffff", background: "#268447" }] });
  if (includes("perimeter-light-1")) regularPolygon(14, 600).forEach(([x, y], index) => components.push({ id: `perimeter-light-${index + 1}`, primitive: "sphere", dimensions: { radius: 18 }, position: [x, y, 55], rotation: [0, 0, 0], colour: "#f2cf32", material: "emissive", parentId: "sign-housing" }));
  if (includes("remote-holder")) components.push({ id: "remote-holder", primitive: "box", dimensions: { x: 105, y: 185, z: 55 }, position: [450, 97.5, 0], rotation: [0, 0, 0], colour: "#1f3038", material: "metal", parentId: "base" });
  if (includes("remote-control")) components.push({ id: "remote-control", primitive: "box", dimensions: { x: 60, y: 145, z: 20 }, position: [0, 0, 38], rotation: [0, 0, 0], colour: "#4ab8df", material: "plastic", parentId: "remote-holder" });
  if (!sameIds(plan.componentIds, components.map(({ id }) => id))) return { blocker: invalidPlan() };
  const geometry: ConceptGeometry = { schemaVersion: 1, builderVersion: 3, nonAuthoritative: true, units: "mm", eligibility: "physical-product", status: "draft", source: { conceptFamilyId: candidate.conceptFamilyId, candidateId: candidate.candidateId, revision: candidate.revision }, overallBounds: { x: 1700, y: 2100, z: 1200 }, components, joints: [{ id: "sign-head-rotation", type: "revolute", parentId: signParent, childId: "sign-housing", pivot: signPosition, axis: [0, 1, 0], defaultAngle: 0, minAngle: 0, maxAngle: 180 }] };
  try { assertConceptGeometry(geometry); return { geometry }; } catch { return { blocker: { code: "invalid-geometry", safeMessage: "REV could not validate the initial geometry." } }; }
}

export function validateInitialGeometryPlan(value: unknown): value is InitialGeometryPlan {
  if (!isExactRecord(value, planKeys)) return false;
  const plan = value as InitialGeometryPlan;
  if (plan.version !== 1 || plan.nonAuthoritative !== true || plan.profile !== PROFILE || !Array.isArray(plan.parameters) || plan.parameters.length > MAX_PARAMETERS || !Array.isArray(plan.componentIds) || plan.componentIds.length > MAX_COMPONENT_IDS || !plan.componentIds.every(validId) || new Set(plan.componentIds).size !== plan.componentIds.length) return false;
  const datumIds = new Set<string>();
  if (!plan.parameters.every((datum) => validDatum(datum) && !datumIds.has(datum.id) && Boolean(datumIds.add(datum.id)))) return false;
  return plan.blocker === undefined || validBlocker(plan.blocker);
}

function validDatum(value: unknown): value is InitialGeometryDatum {
  if (!isExactRecord(value, datumKeys) || !validId(value.id) || typeof value.label !== "string" || !value.label.trim() || value.label.length > 120 || !["string", "number", "boolean"].includes(typeof value.value) || (typeof value.value === "string" && value.value.length > 256) || (typeof value.value === "number" && !Number.isFinite(value.value)) || (value.unit !== undefined && !["mm", "degrees", "count"].includes(String(value.unit))) || typeof value.blocksGeometry !== "boolean" || typeof value.inventorConfirmationDesirable !== "boolean") return false;
  return (value.status === "inventor-evidence" && value.basis === "accepted-description") || (value.status === "interpreted" && value.basis === "cleared-image-interpretation") || (value.status === "working-assumption" && value.basis === "rev-portable-signage-profile");
}

function validBlocker(value: unknown): value is InitialGeometryBlocker { return isExactRecord(value, ["code", "safeMessage"]) && ["unsupported-profile", "insufficient-form", "invalid-plan", "invalid-geometry"].includes(value.code as string) && typeof value.safeMessage === "string" && value.safeMessage.trim().length > 0 && value.safeMessage.length <= 240; }
function validId(value: unknown): value is string { return typeof value === "string" && ID_PATTERN.test(value); }
function sameIds(left: string[], right: string[]): boolean { return left.length === right.length && left.every((id) => right.includes(id)); }
function blockedPlan(): InitialGeometryPlan { return { version: 1, nonAuthoritative: true, profile: PROFILE, parameters: [], componentIds: [], blocker: BLOCKED }; }
function invalidPlan(): InitialGeometryBlocker { return { code: "invalid-plan", safeMessage: "REV could not safely form the initial geometry plan." }; }
function normalize(value: string): string { return value.toLowerCase().replace(/[^a-z0-9/]+/g, " ").trim(); }
function regularPolygon(sides: number, diameter: number): GeometryPoint2[] { return Array.from({ length: sides }, (_, index) => { const angle = Math.PI / 2 + index * Math.PI * 2 / sides; return [Math.cos(angle) * diameter / 2, Math.sin(angle) * diameter / 2] as const; }).reverse(); }
function isExactRecord(value: unknown, keys: string[]): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).every((key) => keys.includes(key)); }
