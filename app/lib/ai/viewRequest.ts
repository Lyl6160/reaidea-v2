import type { ConceptViewId } from "./types";

export type RefinementIntent = {
  designClauses: string[];
  hasViewChange: boolean;
  fullObject: boolean;
  requestedView?: ConceptViewId;
};

const DESIGN_ATTRIBUTE = /\b(stainless steel|aluminium|aluminum|steel|timber|wood|plastic|fabric|metallic|silver|black|white|red|yellow|blue|green|orange|grey|gray|larger|smaller|longer|shorter|wider|narrower|thicker|thinner|curved|straight|round|square|hexagonal|transparent|opaque|matte|glossy|add|remove|move|shape)\b/i;
const VIEW_LANGUAGE = /\b(show|view|camera|frame|framing|crop|zoom|isometric|iso|front|side|rear|overall|whole|complete|everything|top to bottom)\b/i;

export function interpretRefinementIntent(value: string): RefinementIntent {
  const requestedView = requestedViewpoint(value);
  const fullObject = Boolean(requestedView) || /\b(overall view|whole (?:invention|design|object|image)|complete (?:invention|design|object|pole|image)|show everything|zoom out|full (?:invention|design|object|image)|top to bottom)\b/i.test(value);
  const clauses = value.trim().replace(/^make\s+/i, "").split(/\s*,\s*|\s+and\s+/i).map((clause) => clause.trim()).filter(Boolean).slice(0, 12);
  const designClauses = clauses.filter((clause) => !(VIEW_LANGUAGE.test(clause) && !DESIGN_ATTRIBUTE.test(clause)));
  return {
    designClauses,
    hasViewChange: fullObject || Boolean(requestedView) || /\b(rear view|from the rear)\b/i.test(value),
    fullObject,
    requestedView,
  };
}

function requestedViewpoint(value: string): ConceptViewId | undefined {
  if (/\b(isometric|iso(?:metric)? view|three[- ]quarter)\b/i.test(value)) return "iso";
  if (/\b(front view|front elevation|from the front)\b/i.test(value)) return "front";
  if (/\b(side view|side elevation|from the side|show the side)\b/i.test(value)) return "side";
  return undefined;
}
