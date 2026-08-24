import { CREATION_INTENT_BLOCK_MESSAGE, CREATION_INTENT_HOLD_MESSAGE, preflightCreationIntent } from "../../lib/ai/revImageSafetyPolicy.server";

export const runtime = "nodejs";

const MAX_DESCRIPTION_LENGTH = 1_600;

type CreationIntentResponse =
  | { decision: "CLEAR"; limitations: string[] }
  | { decision: "HOLD"; message: string; question: string }
  | { decision: "BLOCK"; message: string }
  | { decision: "unavailable"; message: string };

export async function POST(request: Request): Promise<Response> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return Response.json({ decision: "unavailable", message: "REV couldn’t confirm the creation safety boundary. No concept was created." } satisfies CreationIntentResponse, { status: 400 });
  }
  if (!isCreationIntentRequest(value)) {
    return Response.json({ decision: "unavailable", message: "REV couldn’t confirm the creation safety boundary. No concept was created." } satisfies CreationIntentResponse, { status: 400 });
  }

  const decision = preflightCreationIntent(value.description);
  if (decision.decision === "CLEAR") return Response.json({ decision: "CLEAR", limitations: decision.limitations } satisfies CreationIntentResponse);
  if (decision.decision === "HOLD") return Response.json({ decision: "HOLD", message: CREATION_INTENT_HOLD_MESSAGE, question: decision.question } satisfies CreationIntentResponse, { status: 422 });
  if (decision.decision === "BLOCK") return Response.json({ decision: "BLOCK", message: CREATION_INTENT_BLOCK_MESSAGE } satisfies CreationIntentResponse, { status: 422 });
  return Response.json({ decision: "unavailable", message: "REV couldn’t confirm the creation safety boundary. No concept was created." } satisfies CreationIntentResponse, { status: 503 });
}

function isCreationIntentRequest(value: unknown): value is { description: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return Object.keys(input).length === 1 && typeof input.description === "string" && input.description.length <= MAX_DESCRIPTION_LENGTH;
}
