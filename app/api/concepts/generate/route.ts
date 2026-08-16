import type {
  ConceptBrief,
  ConceptBriefSource,
  ConceptGenerationApiResponse,
  ConceptGenerationRequest,
} from "../../../lib/ai/types";
import {
  ConceptGenerationServiceError,
  generateConcept,
} from "../../../lib/ai/aiService.server";

export const runtime = "nodejs";

const MAX_REQUEST_LENGTH = 24_000;
const MAX_SHORT_TEXT = 240;
const MAX_BRIEF_TEXT = 1_600;
const MAX_LIST_ITEMS = 12;
const MAX_SOURCE_ITEMS = 24;

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > MAX_REQUEST_LENGTH) {
      return errorResponse("invalid-request", "The concept request is invalid or too large.", false, 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return errorResponse("invalid-request", "The concept request is not valid JSON.", false, 400);
    }

    if (!isConceptGenerationRequest(parsed)) {
      return errorResponse("invalid-request", "The concept request is incomplete or invalid.", false, 400);
    }
    if (parsed.visualMode === "unknown") {
      return errorResponse("invalid-request", "Confirm a visual mode before generation.", false, 400);
    }
    if (parsed.visualMode !== "product" || parsed.outputType !== "image") {
      return errorResponse("unsupported-mode", "Visual generation for this mode is coming next.", false, 422);
    }

    const candidate = await generateConcept(parsed);
    return Response.json({ candidate } satisfies ConceptGenerationApiResponse);
  } catch (error) {
    if (error instanceof ConceptGenerationServiceError) {
      return errorResponse(
        error.code,
        error.message,
        error.retryable,
        error.code === "not-configured" ? 503 : error.code === "unsupported-mode" ? 422 : 502
      );
    }
    console.error("Concept generation route failed with an unexpected error.");
    return errorResponse("provider-failure", "Concept generation could not complete.", true, 500);
  }
}

function isConceptGenerationRequest(value: unknown): value is ConceptGenerationRequest {
  if (!isRecord(value)) return false;
  if (
    !shortText(value.requestId) ||
    !shortText(value.conceptFamilyId) ||
    value.revision !== 1 ||
    !boundedText(value.title, MAX_SHORT_TEXT) ||
    !isVisualMode(value.visualMode) ||
    !isOutputType(value.outputType) ||
    value.briefVersion !== 1 ||
    !isConceptBrief(value.brief) ||
    !stringList(value.sourceEventIds, MAX_SOURCE_ITEMS, MAX_SHORT_TEXT) ||
    !Array.isArray(value.sourceTrace) ||
    value.sourceTrace.length > MAX_SOURCE_ITEMS ||
    !value.sourceTrace.every(isConceptBriefSource)
  ) {
    return false;
  }
  const tracedEventIds = new Set(
    value.sourceTrace
      .filter((source) => source.sourceKind === "timeline-event")
      .map((source) => source.sourceId)
  );
  return value.sourceEventIds.every((id) => tracedEventIds.has(id));
}

function isConceptBrief(value: unknown): value is ConceptBrief {
  if (!isRecord(value)) return false;
  return (
    boundedText(value.originalIdea, MAX_BRIEF_TEXT) &&
    boundedText(value.problemContext, MAX_BRIEF_TEXT) &&
    boundedText(value.proposedSolution, MAX_BRIEF_TEXT) &&
    boundedText(value.operatingConcept, MAX_BRIEF_TEXT) &&
    boundedText(value.functionalElements, MAX_BRIEF_TEXT) &&
    optionalText(value.inputsOutputs) &&
    optionalText(value.relationshipsFlow) &&
    optionalText(value.userInteraction) &&
    optionalText(value.arrangement) &&
    stringList(value.constraints, MAX_LIST_ITEMS, MAX_BRIEF_TEXT) &&
    stringList(value.assumptions, MAX_LIST_ITEMS, MAX_BRIEF_TEXT) &&
    optionalText(value.technicalUncertainty)
  );
}

function isConceptBriefSource(value: unknown): value is ConceptBriefSource {
  return isRecord(value) &&
    typeof value.field === "string" &&
    value.field in SOURCE_FIELDS &&
    (value.sourceKind === "project-field" || value.sourceKind === "timeline-event") &&
    shortText(value.sourceId);
}

const SOURCE_FIELDS: Record<keyof ConceptBrief, true> = {
  originalIdea: true,
  problemContext: true,
  proposedSolution: true,
  operatingConcept: true,
  functionalElements: true,
  inputsOutputs: true,
  relationshipsFlow: true,
  userInteraction: true,
  arrangement: true,
  constraints: true,
  assumptions: true,
  technicalUncertainty: true,
};

function isVisualMode(value: unknown): value is ConceptGenerationRequest["visualMode"] {
  return ["product", "machine", "process", "software", "system", "environmental", "mixed", "unknown"].includes(String(value));
}

function isOutputType(value: unknown): value is ConceptGenerationRequest["outputType"] {
  return ["image", "diagram", "ui-mockup", "graph", "hybrid"].includes(String(value));
}

function optionalText(value: unknown): boolean {
  return value === undefined || boundedText(value, MAX_BRIEF_TEXT);
}

function shortText(value: unknown): value is string {
  return boundedText(value, MAX_SHORT_TEXT);
}

function boundedText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function stringList(value: unknown, maxItems: number, maxItemLength: number): value is string[] {
  return Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => boundedText(item, maxItemLength));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorResponse(
  code: "invalid-request" | "unsupported-mode" | "not-configured" | "provider-failure",
  message: string,
  retryable: boolean,
  status: number
): Response {
  return Response.json(
    { error: { code, message, retryable } } satisfies ConceptGenerationApiResponse,
    { status }
  );
}
