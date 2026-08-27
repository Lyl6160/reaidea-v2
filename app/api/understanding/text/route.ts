import {
  REV_UNDERSTANDING_MAX_REQUEST_BYTES,
  REV_UNDERSTANDING_MAX_RESPONSE_BYTES,
  deriveAcceptedBindingDigest,
  emptyRevUnderstandingAccounting,
  parseRevUnderstandingRequest,
  recomputeRequestKnowledgeBasisRevision,
  recomputeRequestOperationKey,
  type RevUnderstandingApiResponse,
} from "../../../lib/ai/revUnderstandingTypes";
import {
  resolveRevUnderstandingFeatureGate,
  runRevUnderstandingOperation,
} from "../../../lib/ai/revUnderstandingService.server";

export const runtime = "nodejs";

const FALLBACK_MESSAGE = "REV is continuing with the information already secured." as const;

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return safeError("origin-rejected", 403);
  const contentType = request.headers.get("content-type")?.toLocaleLowerCase() ?? "";
  if (contentType.split(";", 1)[0].trim() !== "application/json") return safeError("invalid-request", 415);
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > REV_UNDERSTANDING_MAX_REQUEST_BYTES) {
    return safeError("invalid-request", 413);
  }

  let body = "";
  try {
    body = await request.text();
  } catch {
    return safeError("invalid-request", 400);
  }
  if (new TextEncoder().encode(body).byteLength > REV_UNDERSTANDING_MAX_REQUEST_BYTES) {
    return safeError("invalid-request", 413);
  }

  let value: unknown;
  try {
    value = JSON.parse(body) as unknown;
  } catch {
    return safeError("invalid-request", 400);
  }
  const input = parseRevUnderstandingRequest(value);
  if (!input) return safeError("invalid-request", 400);

  if (recomputeRequestKnowledgeBasisRevision(input) !== input.knowledgeBasisRevision ||
    deriveAcceptedBindingDigest(input.activeKnowledge) !== input.acceptedBindingDigest ||
    recomputeRequestOperationKey(input) !== input.operationKey ||
    !referencesClose(input)) return safeError("invalid-request", 409);

  const gate = resolveRevUnderstandingFeatureGate();
  const founderLiveAllowed = gate === "founder-live-test" &&
    process.env.NODE_ENV !== "production" &&
    process.env.REAIDEA_HAI2_FOUNDER_LIVE_ATTEMPT === "authorize-one" &&
    isLoopbackRequest(request);
  if (gate !== "mock" && !founderLiveAllowed) {
    return json({
      status: "disabled",
      operationId: input.operationId,
      operationKey: input.operationKey,
      projectId: input.projectId,
      knowledgeBasisRevision: input.knowledgeBasisRevision,
      message: FALLBACK_MESSAGE,
      errorCategory: "disabled",
      accounting: emptyRevUnderstandingAccounting({ deliberateRouteRequests: 1 }),
    }, 503);
  }

  try {
    const result = await runRevUnderstandingOperation(input, gate);
    return json(result, result.status === "completed" ? 200 : 503);
  } catch {
    return safeError("unavailable", 503);
  }
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isLoopbackRequest(request: Request): boolean {
  try {
    const hostname = new URL(request.url).hostname.toLocaleLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" ||
      hostname === "[::1]" || hostname === "::1";
  } catch {
    return false;
  }
}

function referencesClose(input: NonNullable<ReturnType<typeof parseRevUnderstandingRequest>>): boolean {
  const sourceIds = new Set<string>([
    input.originalDescriptionSource.id,
    ...input.activeKnowledge.map((record) => record.eventId),
  ]);
  return input.activeKnowledge.every((record) =>
    record.supportingSourceIds.every((sourceId) => sourceIds.has(sourceId))
  ) && input.unresolvedConflictEventIds.every((eventId) => sourceIds.has(eventId));
}

function safeError(errorCategory: "invalid-request" | "origin-rejected" | "unavailable", status: number): Response {
  return json({
    status: "fallback",
    message: FALLBACK_MESSAGE,
    errorCategory,
    accounting: emptyRevUnderstandingAccounting({
      deliberateRouteRequests: 1,
      fallbackPresentations: 1,
    }),
  }, status);
}

function json(value: RevUnderstandingApiResponse, status: number): Response {
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).byteLength > REV_UNDERSTANDING_MAX_RESPONSE_BYTES) {
    const fallback: RevUnderstandingApiResponse = {
      status: "fallback",
      message: FALLBACK_MESSAGE,
      errorCategory: "oversized-response",
      accounting: emptyRevUnderstandingAccounting({ deliberateRouteRequests: 1, fallbackPresentations: 1 }),
    };
    return new Response(JSON.stringify(fallback), { status: 503, headers: responseHeaders() });
  }
  return new Response(serialized, { status, headers: responseHeaders() });
}

function responseHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}
