import type {
  ConceptRefinementApiResponse,
  ConceptRefinementRequest,
} from "../../../lib/ai/types";
import {
  ConceptGenerationServiceError,
  refineConcept,
} from "../../../lib/ai/aiService.server";

export const runtime = "nodejs";

const MAX_REQUEST_LENGTH = 25_000_000;
const MAX_REFINEMENT_LENGTH = 1_200;
const MAX_SOURCE_ITEMS = 24;
const MAX_IMAGE_BYTES = 18_000_000;

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > MAX_REQUEST_LENGTH) {
      return errorResponse("invalid-request", "The model update request is invalid or too large.", false, 400);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return errorResponse("invalid-request", "The model update request is not valid JSON.", false, 400);
    }
    if (!isConceptRefinementRequest(parsed)) {
      return errorResponse("invalid-request", "The model update request is incomplete or invalid.", false, 400);
    }
    if (parsed.visualMode !== "product" || parsed.outputType !== "image") {
      return errorResponse("unsupported-mode", "Visual refinement for this mode is coming next.", false, 422);
    }

    return Response.json({ candidate: await refineConcept(parsed) } satisfies ConceptRefinementApiResponse);
  } catch (error) {
    if (error instanceof ConceptGenerationServiceError) {
      return errorResponse(
        error.code,
        error.message,
        error.retryable,
        error.code === "not-configured" ? 503 : error.code === "unsupported-mode" ? 422 : 502
      );
    }
    console.error("Concept refinement route failed with an unexpected error.");
    return errorResponse("provider-failure", "Model update could not complete.", true, 500);
  }
}

function isConceptRefinementRequest(value: unknown): value is ConceptRefinementRequest {
  if (!isRecord(value)) return false;
  const sourceImage = value.sourceImage;
  const brief = value.brief;
  if (
    !shortText(value.requestId) || !shortText(value.conceptFamilyId) ||
    !shortText(value.sourceCandidateId) || !Number.isInteger(value.sourceRevision) ||
    value.nextRevision !== Number(value.sourceRevision) + 1 ||
    !shortText(value.title) || value.visualMode !== "product" ||
    !["product-concept", "engineering-outline"].includes(String(value.representationStyle)) || value.outputType !== "image" ||
    value.briefVersion !== 1 || !isRecord(brief) || JSON.stringify(brief).length > 18_000 ||
    !boundedText(brief.originalIdea, 1_600) || !boundedText(brief.problemContext, 1_600) ||
    !boundedText(brief.proposedSolution, 1_600) || !boundedText(brief.operatingConcept, 1_600) ||
    !boundedText(brief.functionalElements, 1_600) ||
    !optionalText(brief.inputsOutputs) || !optionalText(brief.relationshipsFlow) ||
    !optionalText(brief.userInteraction) || !optionalText(brief.arrangement) ||
    !optionalText(brief.technicalUncertainty) || !textList(brief.constraints) || !textList(brief.assumptions) ||
    !Array.isArray(value.sourceEventIds) || value.sourceEventIds.length > MAX_SOURCE_ITEMS ||
    !value.sourceEventIds.every(shortText) || !Array.isArray(value.sourceTrace) ||
    value.sourceTrace.length > MAX_SOURCE_ITEMS || !boundedText(value.inventorRefinement, MAX_REFINEMENT_LENGTH) ||
    !isRecord(sourceImage) || !["image/png", "image/jpeg", "image/webp"].includes(String(sourceImage.mediaType)) ||
    !validImageDataUrl(sourceImage.dataUrl) ||
    !String(sourceImage.dataUrl).startsWith(`data:${String(sourceImage.mediaType)};base64,`)
  ) return false;
  if (Number(value.sourceRevision) < 1 || !value.sourceTrace.every((item) => isRecord(item) && shortText(item.sourceId))) return false;
  const tracedEventIds = new Set(value.sourceTrace.flatMap((item) =>
    isRecord(item) && item.sourceKind === "timeline-event" && typeof item.sourceId === "string" ? [item.sourceId] : []
  ));
  return value.sourceEventIds.every((id) => tracedEventIds.has(id));
}

function validImageDataUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  return Boolean(match && Math.floor((match[2].length * 3) / 4) <= MAX_IMAGE_BYTES);
}

function shortText(value: unknown): value is string { return boundedText(value, 240); }
function optionalText(value: unknown): boolean { return value === undefined || boundedText(value, 1_600); }
function textList(value: unknown): boolean {
  return Array.isArray(value) && value.length <= 12 && value.every((item) => boundedText(item, 1_600));
}
function boundedText(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= limit;
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
  return Response.json({ error: { code, message, retryable } } satisfies ConceptRefinementApiResponse, { status });
}
