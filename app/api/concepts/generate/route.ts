import type {
  ConceptBrief,
  ConceptBriefSource,
  ConceptGenerationApiResponse,
  ConceptGenerationErrorCode,
  ConceptGenerationRequest,
} from "../../../lib/ai/types";
import {
  ConceptGenerationServiceError,
  configuredConceptImageModel,
  generateConcept,
} from "../../../lib/ai/aiService.server";

export const runtime = "nodejs";

const MAX_REQUEST_LENGTH = 5_700_000;
const MAX_SHORT_TEXT = 240;
const MAX_BRIEF_TEXT = 1_600;
const MAX_LIST_ITEMS = 12;
const MAX_SOURCE_ITEMS = 24;

export async function POST(request: Request): Promise<Response> {
  let parsed: unknown;
  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > MAX_REQUEST_LENGTH) {
      logRouteValidation(undefined, false, 400);
      return errorResponse("invalid-request", "The concept request is invalid or too large.", false, 400, "unavailable", 0);
    }

    try {
      parsed = JSON.parse(rawBody);
    } catch {
      logRouteValidation(undefined, false, 400);
      return errorResponse("invalid-request", "The concept request is not valid JSON.", false, 400, "unavailable", 0);
    }

    if (!isConceptGenerationRequest(parsed)) {
      logRouteValidation(parsed, hasReferenceImage(parsed), 400);
      return errorResponse("invalid-request", "The concept request is incomplete or invalid.", false, 400, requestIdFrom(parsed), 0);
    }
    if (parsed.visualMode === "unknown") {
      logRouteValidation(parsed, Boolean(parsed.referenceImage), 400);
      return errorResponse("invalid-request", "Confirm a visual mode before generation.", false, 400, requestIdFrom(parsed), 0);
    }
    if (parsed.visualMode !== "product" || parsed.outputType !== "image") {
      logRouteValidation(parsed, Boolean(parsed.referenceImage), 422, "unsupported-mode");
      return errorResponse("unsupported-mode", "Visual generation for this mode is coming next.", false, 422, requestIdFrom(parsed), 0);
    }

    const result = await generateConcept(parsed);
    return Response.json(result satisfies ConceptGenerationApiResponse);
  } catch (error) {
    if (error instanceof ConceptGenerationServiceError) {
      return errorResponse(
        error.code,
        error.message,
        error.retryable,
        error.code === "not-configured" || error.code === "safety-unavailable" ? 503 : error.code === "unsupported-mode" || error.code === "safety-hold" || error.code === "safety-block" ? 422 : 502,
        requestIdFrom(parsed),
        error.diagnostic?.providerOperationAttempts ?? "unknown",
        error.diagnostic?.modelIdentifier
      );
    }
    console.error("Concept generation route failed with an unexpected error.");
    return errorResponse("provider-failure", "Concept generation could not complete.", true, 500, requestIdFrom(parsed), "unknown");
  }
}

function logRouteValidation(
  value: unknown,
  referencePresent: boolean,
  httpStatus: number,
  finalInternalServiceErrorCode: ConceptGenerationErrorCode = "invalid-request"
): void {
  if (process.env.NODE_ENV !== "development") return;
  const requestId = isRecord(value) && shortText(value.requestId) ? value.requestId : "unavailable";
  console.error("Concept generation diagnostic.", {
    requestId,
    endpoint: "/api/concepts/generate",
    stage: "route-validation",
    operationType: "request-validation",
    imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1",
    httpStatus,
    providerErrorCode: undefined,
    providerErrorName: undefined,
    finalInternalServiceErrorCode,
    referencePresent,
    attemptedProviderOperations: 0,
  });
}

function hasReferenceImage(value: unknown): boolean {
  return isRecord(value) && value.referenceImage !== undefined;
}

function isConceptGenerationRequest(value: unknown): value is ConceptGenerationRequest {
  if (!isRecord(value)) return false;
  if (
    !shortText(value.requestId) ||
    !shortText(value.conceptFamilyId) ||
    value.revision !== 1 ||
    !boundedText(value.title, MAX_SHORT_TEXT) ||
    !isVisualMode(value.visualMode) ||
    !isRepresentationStyle(value.representationStyle) ||
    !isOutputType(value.outputType) ||
    value.briefVersion !== 1 ||
    !isConceptBrief(value.brief) ||
    !stringList(value.sourceEventIds, MAX_SOURCE_ITEMS, MAX_SHORT_TEXT) ||
    !Array.isArray(value.sourceTrace) ||
    value.sourceTrace.length > MAX_SOURCE_ITEMS ||
    !value.sourceTrace.every(isConceptBriefSource) ||
    !isOptionalReferenceImage(value.referenceImage)
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

function isOptionalReferenceImage(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value) ||
    !shortText(value.evidenceReference) ||
    !value.evidenceReference.startsWith("source-image:") ||
    !shortText(value.sourceEventId) ||
    !["image/png", "image/jpeg", "image/webp"].includes(String(value.mediaType)) ||
    typeof value.dataUrl !== "string"
  ) return false;
  const match = value.dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return false;
  const expectedType = `image/${match[1]}`;
  if (expectedType !== value.mediaType) return false;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > 4 * 1024 * 1024) return false;
  return hasImageSignature(bytes, match[1]);
}

function hasImageSignature(bytes: Buffer, format: string): boolean {
  if (format === "png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (format === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
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
    (value.sourceKind === "project-field" || value.sourceKind === "timeline-event" || value.sourceKind === "bench-note" || value.sourceKind === "source-evidence-interpretation") &&
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

function isRepresentationStyle(
  value: unknown
): value is ConceptGenerationRequest["representationStyle"] {
  return ["product-concept", "engineering-outline", "wireframe", "solid-concept"].includes(String(value));
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
  code: ConceptGenerationErrorCode,
  message: string,
  retryable: boolean,
  status: number,
  correlationId: string,
  providerOperationAttempts: number | "unknown",
  modelIdentifier = configuredConceptImageModel()
): Response {
  return Response.json(
    { error: { code, message, retryable, diagnostic: { correlationId, category: code, httpStatus: status, providerOperationAttempts, modelIdentifier, occurredAt: new Date().toISOString(), retryable } } } satisfies ConceptGenerationApiResponse,
    { status }
  );
}

function requestIdFrom(value: unknown): string {
  return isRecord(value) && shortText(value.requestId) ? value.requestId : "unavailable";
}
