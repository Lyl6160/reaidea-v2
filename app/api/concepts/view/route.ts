import type { ConceptGenerationErrorCode, ConceptViewAssetApiResponse, ConceptViewAssetRequest } from "../../../lib/ai/types";
import { ConceptGenerationServiceError, generateViewAsset } from "../../../lib/ai/aiService.server";

export const runtime = "nodejs";

const MAX_REQUEST_LENGTH = 80_000;

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > MAX_REQUEST_LENGTH) return errorResponse("invalid-request", "The view request is invalid or too large.", false, 400);
    let parsed: unknown;
    try { parsed = JSON.parse(rawBody); } catch { return errorResponse("invalid-request", "The view request is not valid JSON.", false, 400); }
    if (!isViewAssetRequest(parsed)) return errorResponse("invalid-request", "The view request is incomplete or invalid.", false, 400);
    return Response.json({ view: await generateViewAsset(parsed) } satisfies ConceptViewAssetApiResponse);
  } catch (error) {
    if (error instanceof ConceptGenerationServiceError) {
      return errorResponse(error.code, error.message, error.retryable, error.code === "not-configured" || error.code === "safety-unavailable" ? 503 : error.code === "unsupported-mode" || error.code === "safety-hold" || error.code === "safety-block" ? 422 : 502);
    }
    return errorResponse("provider-failure", "View generation could not complete.", true, 500);
  }
}

function isViewAssetRequest(value: unknown): value is ConceptViewAssetRequest {
  if (!isRecord(value) || !isRecord(value.brief)) return false;
  return shortText(value.requestId) && shortText(value.conceptFamilyId) && shortText(value.sourceCandidateId) &&
    Number.isInteger(value.revision) && Number(value.revision) >= 1 && shortText(value.title) &&
    value.visualMode === "product" && ["product-concept", "engineering-outline"].includes(String(value.representationStyle)) && value.outputType === "image" &&
    ["iso", "front", "side"].includes(String(value.requestedView)) && typeof value.fullObject === "boolean" && value.briefVersion === 1 &&
    JSON.stringify(value.brief).length <= 18_000 && Array.isArray(value.sourceEventIds) && value.sourceEventIds.length <= 24 &&
    value.sourceEventIds.every(shortText) && Array.isArray(value.sourceTrace) && value.sourceTrace.length <= 24;
}

function shortText(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0 && value.length <= 240; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function errorResponse(code: ConceptGenerationErrorCode, message: string, retryable: boolean, status: number): Response {
  return Response.json({ error: { code, message, retryable } } satisfies ConceptViewAssetApiResponse, { status });
}
