import type { ConceptBrief, ConceptVisualDesignSnapshot } from "./types";

export type ConceptImageSize = "1024x1024" | "1024x1536" | "1536x1024";

const MATERIAL = /\b(stainless steel|aluminium|aluminum|steel|timber|wood|plastic|fabric|metallic|silver)\b/i;
const COLOUR = /\b(black|white|red|yellow|blue|green|orange|grey|gray)\b/i;
const MOVEMENT = /\b(move|moves|moving|rotate|rotates|rotating|turn|turns|fold|slide|open|close|adjust|pivot)\b/i;
const PROPORTION = /\b\d+(?:\.\d+)?\s*(?:mm|cm|m|metre|meter|inch|foot|feet)\b|\b(full[- ]height|full pole|top to bottom|overall height|proportion)\b/i;
const RELATIONSHIP = /\b(front|reverse|rear|opposing|attached|mounted|inside|outside|above|below|between|connected|perimeter)\b/i;
const LABEL = /\b(label|lettering|wording|text|reads?|says?|front face|reverse face)\b/i;

export function createVisualDesignSnapshot(brief: ConceptBrief): ConceptVisualDesignSnapshot {
  const bounded = [brief.originalIdea, brief.proposedSolution, brief.operatingConcept, brief.functionalElements, brief.arrangement, brief.relationshipsFlow].filter(Boolean) as string[];
  const details = splitDetails(bounded);
  return {
    nonAuthoritative: true,
    overallGeometry: unique([brief.proposedSolution, brief.originalIdea].filter(Boolean)),
    components: unique([brief.functionalElements].filter(Boolean)),
    materials: details.filter((detail) => MATERIAL.test(detail)),
    colours: details.filter((detail) => COLOUR.test(detail)),
    labels: details.filter((detail) => LABEL.test(detail) || /\b[A-Z][A-Z0-9-]{1,}\b/.test(detail)),
    relationships: details.filter((detail) => RELATIONSHIP.test(detail)),
    movement: details.filter((detail) => MOVEMENT.test(detail)),
    proportions: details.filter((detail) => PROPORTION.test(detail)),
    visualConstraints: unique(brief.constraints),
    preservedFeatures: details,
    uncertainties: unique([brief.technicalUncertainty].filter(Boolean)),
    componentAttributes: {},
  };
}

export function applyVisualDesignChanges(snapshot: ConceptVisualDesignSnapshot, clauses: string[]): ConceptVisualDesignSnapshot {
  const next = structuredClone(snapshot);
  for (const clause of clauses) {
    const change = parseComponentAttribute(clause);
    if (!change) {
      next.visualConstraints = unique([...next.visualConstraints, clause]);
      continue;
    }
    const component = next.componentAttributes[change.component] ?? {};
    component[change.category] = [change.attribute];
    next.componentAttributes[change.component] = component;
    if (!next.components.some((item) => item.toLowerCase().includes(change.component))) next.components.push(change.component);
  }
  return next;
}

export function formatVisualDesignSnapshot(snapshot: ConceptVisualDesignSnapshot): string {
  const componentAttributes = Object.entries(snapshot.componentAttributes).flatMap(([component, attributes]) =>
    Object.entries(attributes).map(([category, values]) => `${component} — ${category}: ${(values ?? []).join("; ")}`)
  );
  return [
    "NON-AUTHORITATIVE VISUAL DESIGN SNAPSHOT",
    line("Overall geometry", snapshot.overallGeometry),
    line("Major components", snapshot.components),
    line("Component attributes", componentAttributes),
    line("Materials", snapshot.materials),
    line("Colours", snapshot.colours),
    line("Labels / visible text", snapshot.labels),
    line("Relationships", snapshot.relationships),
    line("Movement / articulation", snapshot.movement),
    line("Approximate proportions", snapshot.proportions),
    line("Important visual constraints", snapshot.visualConstraints),
    line("Preserved features", snapshot.preservedFeatures),
    line("Known visual uncertainties", snapshot.uncertainties),
  ].filter(Boolean).join("\n").slice(0, 12_000);
}

export function selectConceptImageSize(snapshot: ConceptVisualDesignSnapshot): ConceptImageSize {
  const description = [
    ...snapshot.overallGeometry,
    ...snapshot.components,
    ...snapshot.proportions,
    ...snapshot.visualConstraints,
    ...snapshot.preservedFeatures,
    ...Object.values(snapshot.componentAttributes).flatMap((attributes) => [
      ...(attributes.geometry ?? []),
      ...(attributes.proportions ?? []),
    ]),
  ].join(" ").toLowerCase();
  const measuredRatio = findHeightToWidthRatio(description);

  if (measuredRatio !== undefined) {
    if (measuredRatio >= 1.25) return "1024x1536";
    if (measuredRatio <= 0.8) return "1536x1024";
  }

  const tallSignals = countSignals(description, [
    /\btall\b/g,
    /\bnarrow\b/g,
    /\bvertical\b/g,
    /\bupright\b/g,
    /\bfull[- ]height\b/g,
    /\btop to bottom\b/g,
    /\b(?:pole|post|mast|tower)\b/g,
  ]);
  const wideSignals = countSignals(description, [
    /\bwide\b/g,
    /\blow[- ]profile\b/g,
    /\blong and low\b/g,
    /\bhorizontal\b/g,
    /\b(?:trailer|platform)\b/g,
  ]);

  if (tallSignals > wideSignals && tallSignals > 0) return "1024x1536";
  if (wideSignals > tallSignals && wideSignals > 0) return "1536x1024";
  return "1024x1024";
}

function findHeightToWidthRatio(value: string): number | undefined {
  const height = findNamedMeasurement(value, /(?:overall\s+)?height|tall|high/);
  const width = findNamedMeasurement(value, /(?:overall\s+)?width|wide/);
  if (!height || !width) return undefined;
  return height / width;
}

function findNamedMeasurement(value: string, label: RegExp): number | undefined {
  const unit = "(mm|cm|m|metres?|meters?|inches?|inch|feet|foot|ft)";
  const number = "(\\d+(?:\\.\\d+)?)";
  const afterLabel = value.match(new RegExp(`(?:${label.source})\\s*(?:of|is|:|=)?\\s*${number}\\s*${unit}`, "i"));
  const beforeLabel = value.match(new RegExp(`${number}\\s*${unit}\\s*(?:in\\s+)?(?:${label.source})`, "i"));
  const match = afterLabel ?? beforeLabel;
  return match ? toMillimetres(Number(match[1]), match[2]) : undefined;
}

function toMillimetres(value: number, unit: string): number {
  const normalized = unit.toLowerCase();
  if (normalized === "m" || normalized.startsWith("met")) return value * 1000;
  if (normalized === "cm") return value * 10;
  if (normalized.startsWith("inch")) return value * 25.4;
  if (normalized === "ft" || normalized === "foot" || normalized === "feet") return value * 304.8;
  return value;
}

function countSignals(value: string, patterns: RegExp[]): number {
  return patterns.reduce((total, pattern) => total + (value.match(pattern)?.length ?? 0), 0);
}

function parseComponentAttribute(clause: string): { component: string; category: "materials" | "colours" | "geometry" | "relationships" | "movement"; attribute: string } | null {
  const cleaned = clause.replace(/^make\s+/i, "").replace(/^the\s+/i, "").trim();
  const match = cleaned.match(MATERIAL) ?? cleaned.match(COLOUR);
  const category = match?.[0] && MATERIAL.test(match[0]) ? "materials" : match?.[0] && COLOUR.test(match[0]) ? "colours" : MOVEMENT.test(cleaned) ? "movement" : RELATIONSHIP.test(cleaned) ? "relationships" : /\b(shape|larger|smaller|longer|shorter|wider|narrower|thicker|thinner|curved|straight|round|square|hexagonal)\b/i.test(cleaned) ? "geometry" : null;
  if (!category) return null;
  const index = match?.index ?? cleaned.search(/\b(move|rotate|turn|fold|slide|shape|larger|smaller|longer|shorter|wider|narrower|thicker|thinner|curved|straight|round|square|hexagonal|front|reverse|rear|mounted|attached)\b/i);
  const component = cleaned.slice(0, Math.max(index, 0)).trim().toLowerCase() || "specified component";
  return { component, category, attribute: cleaned.slice(Math.max(index, 0)).trim() || cleaned };
}

function splitDetails(values: string[]): string[] { return unique(values.flatMap((value) => value.split(/[.;\n]+/).map((item) => item.trim()).filter(Boolean))); }
function unique(values: Array<string | undefined>): string[] { return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))]; }
function line(label: string, values: string[]): string { return values.length ? `${label}: ${values.join("; ")}` : ""; }
