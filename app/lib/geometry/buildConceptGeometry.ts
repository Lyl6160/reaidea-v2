import type { ConceptCandidate, ConceptVisualDesignSnapshot } from "../ai/types";
import { assertConceptGeometry, type ConceptGeometry, type ConceptGeometryComponent, type ConceptGeometryMarking, type GeometryPoint2 } from "./conceptGeometry";
import { buildGeometryFromInitialPlan } from "./initialGeometryPlan";

export const CONCEPT_GEOMETRY_BUILDER_VERSION = 2;
export type ConceptGeometryAvailability = "available" | "insufficient-data" | "unsupported-geometry" | "invalid-snapshot";
export type ConceptGeometryBuildResult = { status: "available"; geometry: ConceptGeometry } | { status: Exclude<ConceptGeometryAvailability, "available">; missing: string[] };

const COLOURS: Record<string, string> = { black: "#202426", white: "#f5f5f1", red: "#ef3038", yellow: "#f2cf32", blue: "#2674c8", green: "#268447", orange: "#ef8125", grey: "#7c8588", gray: "#7c8588", silver: "#aeb8ba", metallic: "#aeb8ba" };
const MATERIAL_WORDS = "stainless steel|aluminium|aluminum|steel|metal|plastic|polymer|timber|wood|painted";
const COLOUR_WORDS = Object.keys(COLOURS).join("|");
type ComponentKind = "head" | "pole" | "led";
const ALIASES: Record<ComponentKind, string[]> = { head: ["sign head", "sign", "head", "panel", "display", "placard", "board"], pole: ["pole", "post", "mast", "stand", "support"], led: ["led perimeter", "leds", "led", "lights", "light"] };

export function bindConceptGeometry(candidate: ConceptCandidate): ConceptCandidate {
  if (candidate.initialGeometryPlan) {
    const result = buildGeometryFromInitialPlan(candidate, candidate.initialGeometryPlan);
    if (result.geometry) return { ...candidate, conceptGeometry: result.geometry, conceptGeometryStatus: "available" };
    const { conceptGeometry: _staleGeometry, ...withoutStaleGeometry } = candidate;
    void _staleGeometry;
    return { ...withoutStaleGeometry, conceptGeometryStatus: result.blocker?.code === "unsupported-profile" ? "unsupported-geometry" : "invalid-snapshot" };
  }
  if (!candidate.visualDesignSnapshot || !["product", "machine"].includes(candidate.visualMode)) return candidate;
  const result = buildConceptGeometry(candidate, candidate.visualDesignSnapshot);
  if (result.status === "available") return { ...candidate, conceptGeometry: result.geometry, conceptGeometryStatus: "available" };
  const { conceptGeometry: _staleGeometry, ...withoutStaleGeometry } = candidate;
  void _staleGeometry;
  return { ...withoutStaleGeometry, conceptGeometryStatus: result.status };
}

export function buildConceptGeometry(candidate: ConceptCandidate, snapshot: ConceptVisualDesignSnapshot): ConceptGeometryBuildResult {
  if (!snapshot || snapshot.nonAuthoritative !== true || !snapshot.componentAttributes) return { status: "invalid-snapshot", missing: ["valid visual design snapshot"] };
  const text = snapshotText(snapshot);
  if (!hasAlias(text, "head") || !hasAlias(text, "pole")) return { status: "unsupported-geometry", missing: ["supported component relationship"] };
  const shape = resolveHeadShape(text);
  if (shape.status !== "available") return shape;
  const dimensions = resolveDimensions(text, shape.sides);
  if (dimensions.status !== "available") return dimensions;
  const headColour = resolveColour(snapshot, "head");
  const headMaterial = resolveMaterial(snapshot, "head");
  const poleMaterial = resolveMaterial(snapshot, "pole");
  const poleColour = resolveColour(snapshot, "pole") ?? (poleMaterial === "metal" ? "#aeb8ba" : undefined);
  const ledPresent = /\b(led|light|illuminat)/i.test(text) && /\b(perimeter|edge|border)/i.test(text);
  const ledColour = ledPresent ? resolveColour(snapshot, "led") : undefined;
  const missing = [!headColour && "sign-head colour", !headMaterial && "sign-head material", !poleMaterial && "pole material", !poleColour && "pole colour", ledPresent && !ledColour && "LED colour"].filter((value): value is string => Boolean(value));
  if (missing.length) return { status: "insufficient-data", missing };
  const markingResult = resolveMarkings(snapshot, headColour!);
  if (markingResult.status !== "available") return markingResult;
  const movementResult = resolveMovement(snapshot);
  if (movementResult.status !== "available") return movementResult;

  const outline = shape.sides ? regularPolygon(shape.sides, dimensions.headWidth, dimensions.headHeight) : undefined;
  const headY = dimensions.poleLength / 2;
  const components: ConceptGeometryComponent[] = [
    { id: "support", primitive: "cylinder", dimensions: { radius: dimensions.poleDiameter / 2, height: dimensions.poleLength }, position: [0, dimensions.poleLength / 2, 0], rotation: [0, 0, 0], colour: poleColour!, material: poleMaterial! },
    outline
      ? { id: "display-head", primitive: "extruded-polygon", dimensions: { depth: dimensions.headDepth }, vertices: outline, position: [0, headY, 0], rotation: [0, 0, 0], colour: headColour!, material: headMaterial!, parentId: "support", ...(markingResult.markings.length ? { markings: markingResult.markings } : {}) }
      : { id: "display-head", primitive: "box", dimensions: { x: dimensions.headWidth, y: dimensions.headHeight, z: dimensions.headDepth }, position: [0, headY, 0], rotation: [0, 0, 0], colour: headColour!, material: headMaterial!, parentId: "support", ...(markingResult.markings.length ? { markings: markingResult.markings } : {}) },
  ];
  if (ledPresent) {
    const perimeter = outline ?? rectangle(dimensions.headWidth, dimensions.headHeight);
    evenlySpacedPerimeter(perimeter, 12).forEach(([x, y], index) => components.push({ id: `edge-light-${index + 1}`, primitive: "sphere", dimensions: { radius: Math.max(8, Math.min(16, dimensions.headWidth / 35)) }, position: [x, y, dimensions.headDepth / 2 + 8], rotation: [0, 0, 0], colour: ledColour!, material: "emissive", parentId: "display-head" }));
  }
  const geometry: ConceptGeometry = {
    schemaVersion: 1, builderVersion: CONCEPT_GEOMETRY_BUILDER_VERSION, nonAuthoritative: true, units: "mm", eligibility: candidate.visualMode === "machine" ? "machine" : "physical-product", status: "draft",
    source: { conceptFamilyId: candidate.conceptFamilyId, candidateId: candidate.candidateId, revision: candidate.revision },
    overallBounds: { x: dimensions.headWidth + 80, y: dimensions.poleLength + dimensions.headHeight / 2, z: Math.max(dimensions.poleDiameter, dimensions.headDepth + 32) }, components,
    joints: movementResult.angle ? [{ id: "display-turn", type: "revolute", parentId: "support", childId: "display-head", pivot: [0, headY, 0], axis: [0, 1, 0], defaultAngle: 0, minAngle: 0, maxAngle: movementResult.angle }] : [],
  };
  try { assertConceptGeometry(geometry); return { status: "available", geometry }; } catch { return { status: "invalid-snapshot", missing: ["valid bounded geometry"] }; }
}

function resolveHeadShape(text: string): { status: "available"; sides?: number } | { status: "unsupported-geometry" | "insufficient-data"; missing: string[] } {
  if (/\boctagon(?:al)?\b/i.test(text)) return { status: "available", sides: 8 };
  if (/\bhexagon(?:al)?\b/i.test(text)) return { status: "available", sides: 6 };
  if (/\btriangle|pentagon|heptagon|nonagon|decagon\b/i.test(text)) return { status: "unsupported-geometry", missing: ["supported explicit polygon profile"] };
  if (/\bpolygon(?:al)?\b/i.test(text)) return { status: "insufficient-data", missing: ["polygon side count or profile"] };
  if (/\b(rectang|square|box)/i.test(text)) return { status: "available" };
  return { status: "insufficient-data", missing: ["explicit sign-head shape"] };
}

type Dimensions = { poleLength: number; poleDiameter: number; headWidth: number; headHeight: number; headDepth: number };
function resolveDimensions(text: string, regularSides?: number): ({ status: "available" } & Dimensions) | { status: "insufficient-data"; missing: string[] } {
  const overallHeight = namedMeasurement(text, ["overall height", "full height"]);
  const poleLength = namedMeasurement(text, ["pole length", "pole height", "post length", "post height"]);
  const poleDiameter = namedMeasurement(text, ["pole diameter", "post diameter"]);
  const headWidth = namedMeasurement(text, ["sign head width", "sign width", "head width", "panel width"]);
  const explicitHeadHeight = namedMeasurement(text, ["sign head height", "sign height", "head height", "panel height"]);
  const headHeight = explicitHeadHeight ?? (regularSides ? headWidth : undefined);
  const headDepth = namedMeasurement(text, ["sign head depth", "sign depth", "head depth", "panel depth", "thickness"]);
  const derivedPoleLength = poleLength ?? (overallHeight && headHeight ? overallHeight - headHeight / 2 : undefined);
  const missing = [!derivedPoleLength && "pole/overall height", !poleDiameter && "pole diameter", !headWidth && "sign-head width", !headHeight && "sign-head height", !headDepth && "sign-head depth"].filter((value): value is string => Boolean(value));
  if (missing.length) return { status: "insufficient-data", missing };
  return { status: "available", poleLength: bounded(derivedPoleLength!, 200, 10_000), poleDiameter: bounded(poleDiameter!, 10, 500), headWidth: bounded(headWidth!, 100, 5000), headHeight: bounded(headHeight!, 100, 5000), headDepth: bounded(headDepth!, 5, 1000) };
}

function resolveColour(snapshot: ConceptVisualDesignSnapshot, kind: ComponentKind): string | undefined {
  const structured = componentValues(snapshot, kind, "colours").map(findColour).find(Boolean);
  if (structured) return structured;
  for (const line of [...snapshot.colours, ...snapshot.preservedFeatures]) { const value = attributeBesideAlias(line, kind, COLOUR_WORDS); if (value) return COLOURS[value.toLowerCase()]; }
  return undefined;
}
function resolveMaterial(snapshot: ConceptVisualDesignSnapshot, kind: ComponentKind): "matte" | "plastic" | "metal" | undefined {
  const lines = [...componentValues(snapshot, kind, "materials"), ...snapshot.materials, ...snapshot.preservedFeatures];
  for (const line of lines) { const value = attributeBesideAlias(line, kind, MATERIAL_WORDS); if (!value) continue; if (/stainless|aluminium|aluminum|steel|metal/i.test(value)) return "metal"; if (/plastic|polymer/i.test(value)) return "plastic"; return "matte"; }
  return undefined;
}
function resolveMarkings(snapshot: ConceptVisualDesignSnapshot, background: string): { status: "available"; markings: ConceptGeometryMarking[] } | { status: "insufficient-data"; missing: string[] } {
  const lines = [...snapshot.labels, ...componentValues(snapshot, "head", "labels")];
  if (!lines.length) return { status: "available", markings: [] };
  const byFace = new Map<"front" | "back", string>();
  for (const line of lines) { const face = /\bfront\b/i.test(line) ? "front" : /\b(back|reverse|rear)\b/i.test(line) ? "back" : undefined; const text = labelText(line); if (face && text) byFace.set(face, text); }
  if (!byFace.size || lines.some((line) => labelText(line) && !/\b(front|back|reverse|rear)\b/i.test(line))) return { status: "insufficient-data", missing: ["explicit front/reverse label semantics"] };
  return { status: "available", markings: [...byFace].map(([face, text]) => ({ face, text, fontSize: text.length > 8 ? 44 : 76, foreground: "#202426", background })) };
}
function resolveMovement(snapshot: ConceptVisualDesignSnapshot): { status: "available"; angle?: number } | { status: "insufficient-data"; missing: string[] } {
  const text = [...snapshot.movement, ...componentValues(snapshot, "head", "movement")].join(" ");
  if (!/\b(rotat|turn|pivot)/i.test(text)) return { status: "available" };
  const angle = Number(text.match(/\b(\d{1,3})\s*(?:°|degrees?)/i)?.[1]);
  return angle > 0 && angle <= 360 ? { status: "available", angle } : { status: "insufficient-data", missing: ["rotation limit"] };
}

function componentValues(snapshot: ConceptVisualDesignSnapshot, kind: ComponentKind, category: keyof ConceptVisualDesignSnapshot["componentAttributes"][string]): string[] { return Object.entries(snapshot.componentAttributes).filter(([name]) => hasAlias(name, kind)).flatMap(([, attributes]) => attributes[category] ?? []); }
function hasAlias(text: string, kind: ComponentKind): boolean { return ALIASES[kind].some((alias) => new RegExp(`\\b${escapeRegex(alias)}\\b`, "i").test(text)); }
function attributeBesideAlias(line: string, kind: ComponentKind, attributePattern: string): string | undefined { for (const alias of ALIASES[kind]) { const escaped = escapeRegex(alias); const before = line.match(new RegExp(`\\b(${attributePattern})\\b(?:\\s+\\w+){0,2}\\s+${escaped}\\b`, "i")); const after = line.match(new RegExp(`\\b${escaped}\\b\\s*(?:(?:is|in|made\\s+of|finished\\s+in)\\s+)?(${attributePattern})\\b`, "i")); if (before?.[1] || after?.[1]) return before?.[1] ?? after?.[1]; } return undefined; }
function findColour(text: string): string | undefined { const match = text.match(new RegExp(`\\b(${COLOUR_WORDS})\\b`, "i")); return match ? COLOURS[match[1].toLowerCase()] : undefined; }
function labelText(line: string): string | undefined { return line.match(/["“']([^"”']{1,24})["”']/)?.[1].trim() ?? (line.match(/\b[A-Z][A-Z0-9-]{1,23}\b/g) ?? []).find((word) => !["LED", "LEDS", "REV"].includes(word)); }
function namedMeasurement(text: string, labels: string[]): number | undefined { for (const label of labels) { const match = text.match(new RegExp(`${escapeRegex(label)}\\s*(?:of|is|:|=)?\\s*(\\d+(?:\\.\\d+)?)\\s*(mm|cm|m|metres?|meters?)`, "i")); if (match) return toMillimetres(Number(match[1]), match[2]); } return undefined; }
function toMillimetres(value: number, unit: string): number { const normalized = unit.toLowerCase(); return normalized === "cm" ? value * 10 : normalized === "m" || normalized.startsWith("met") ? value * 1000 : value; }
function snapshotText(snapshot: ConceptVisualDesignSnapshot): string { return [...snapshot.overallGeometry, ...snapshot.components, ...snapshot.materials, ...snapshot.colours, ...snapshot.labels, ...snapshot.relationships, ...snapshot.movement, ...snapshot.proportions, ...snapshot.preservedFeatures, ...Object.entries(snapshot.componentAttributes).flatMap(([name, attributes]) => [name, ...Object.values(attributes).flatMap((values) => values ?? [])])].join("; "); }
function regularPolygon(sides: number, width: number, height: number): GeometryPoint2[] { return Array.from({ length: sides }, (_, index) => { const angle = Math.PI / 2 + index * Math.PI * 2 / sides; return [Math.cos(angle) * width / 2, Math.sin(angle) * height / 2] as const; }).reverse(); }
function rectangle(width: number, height: number): GeometryPoint2[] { return [[-width / 2, height / 2], [width / 2, height / 2], [width / 2, -height / 2], [-width / 2, -height / 2]]; }
function evenlySpacedPerimeter(vertices: GeometryPoint2[], count: number): GeometryPoint2[] { const edges = vertices.map((point, index) => ({ from: point, to: vertices[(index + 1) % vertices.length], length: Math.hypot(vertices[(index + 1) % vertices.length][0] - point[0], vertices[(index + 1) % vertices.length][1] - point[1]) })); const total = edges.reduce((sum, edge) => sum + edge.length, 0); return Array.from({ length: count }, (_, index) => { let distance = total * index / count; for (const edge of edges) { if (distance <= edge.length) { const ratio = distance / edge.length; return [edge.from[0] + (edge.to[0] - edge.from[0]) * ratio, edge.from[1] + (edge.to[1] - edge.from[1]) * ratio] as const; } distance -= edge.length; } return vertices[0]; }); }
function bounded(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
