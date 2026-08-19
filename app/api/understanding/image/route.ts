import type {
  VisualUnderstandingApiResponse,
  VisualUnderstandingRequest,
} from "../../../lib/ai/types";
import {
  understandVisualEvidence,
  VisualUnderstandingServiceError,
} from "../../../lib/ai/aiService.server";

export const runtime = "nodejs";

const MAX_REQUEST_LENGTH = 5_700_000;
const MAX_DESCRIPTION_LENGTH = 1_600;

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > MAX_REQUEST_LENGTH) {
      return errorResponse("invalid-request", "The image-understanding request is invalid or too large.", false, 400);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return errorResponse("invalid-request", "The image-understanding request is not valid JSON.", false, 400);
    }
    if (!isVisualUnderstandingRequest(parsed)) {
      return errorResponse("invalid-request", "The image-understanding request is incomplete or invalid.", false, 400);
    }
    const result = await understandVisualEvidence(parsed);
    if (result.safety.decision !== "CLEAR" || !result.interpretation) {
      return Response.json({ safety: result.safety as Exclude<typeof result.safety, { decision: "CLEAR" }> } satisfies VisualUnderstandingApiResponse);
    }
    return Response.json({ safety: result.safety, interpretation: result.interpretation } satisfies VisualUnderstandingApiResponse);
  } catch (error) {
    if (error instanceof VisualUnderstandingServiceError) {
      return errorResponse(
        error.code,
        error.message,
        error.retryable,
        error.code === "not-configured" ? 503 : error.code === "unsupported" ? 422 : 502
      );
    }
    console.error("Visual-understanding route failed with an unexpected error.");
    return errorResponse("provider-failure", "REV couldn't interpret the reference image this time.", true, 500);
  }
}

function isVisualUnderstandingRequest(value: unknown): value is VisualUnderstandingRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (
    typeof input.requestId !== "string" || !input.requestId.trim() || input.requestId.length > 240 ||
    typeof input.evidenceReference !== "string" || !/^source-image:[A-Za-z0-9-]{8,}$/.test(input.evidenceReference) ||
    !["image/png", "image/jpeg", "image/webp"].includes(String(input.mediaType)) ||
    typeof input.dataUrl !== "string" ||
    (input.inventorDescription !== undefined && (typeof input.inventorDescription !== "string" || input.inventorDescription.length > MAX_DESCRIPTION_LENGTH))
  ) return false;
  const match = input.dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || `image/${match[1]}` !== input.mediaType) return false;
  const bytes = Buffer.from(match[2], "base64");
  return bytes.length > 0 && bytes.length <= 4 * 1024 * 1024 && hasImageSignature(bytes, match[1]);
}

function hasImageSignature(bytes: Buffer, format: string): boolean {
  if (format === "png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (format === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

function errorResponse(
  code: "invalid-request" | "not-configured" | "unsupported" | "provider-failure",
  message: string,
  retryable: boolean,
  status: number
): Response {
  return Response.json(
    { error: { code, message, retryable } } satisfies VisualUnderstandingApiResponse,
    { status }
  );
}
